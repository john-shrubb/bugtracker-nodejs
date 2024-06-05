// Apparently a decent cryptography library.
import bcrypt from 'bcrypt';
import BugtrackCore from '../index.js';
// Imports its own umPool.
import { umPool } from '../dbConnection.js';
import Session from '../types/session.js';
import { QueryResult } from 'pg';
import { possibleEvents } from '../services/cacheInvalidationService.js';
import User from '../types/user.js';
import generateID from '../helperFunctions/genID.js';

interface sessionRowStructure {
	sessiontoken : string;
	userid       : string;
	useragent    : string;
	issuedon     : Date;
	expireson    : Date;
	sessionid    : string;
}

/**
 * The user manager inventory provides methods to authenticate users and update security
 * information, such as passwords.
 * 
 * It also keeps a private cache of all sessions, and login attempts.
 */

class UserManagerInventory {
	constructor(bgCore : BugtrackCore) {
		this.bgCore = bgCore;

		// Builds session cache.

		this.initialiseSessionCache();

		// For if there has been an update to the cache.
		this.bgCore.cacheInvalidation.on('sessionUpdate', this.sessionUpdateCallback);
	}

	/**
	 * Instance of BugtrackCore
	 */
	private bgCore;

	// Sessions.
	// These should be held closely, with session objects only being exposed to other
	// classes if they can supply correct credentials. This section of the class mainly
	// provides CRUD operations (Update isn't really appropriate for a session).

	/**
	 * Cache holding current sessions. The session token is private AND hashed, so to
	 * check a session this class must hash the token before passing it to the session
	 * map.
	 * 
	 * Do not delete items directly from the session map, simply notify cache invalidation
	 * of the change and it will handle the rest.
	 */
	private sessionMap : Map<string, Session> = new Map();

	/**
	 * Initialises the session cache by grabbing all sessions and adding them to the array
	 * of sessions.
	 */
	private async initialiseSessionCache() {
		// Grab all session objects.
		const rawSessionQuery : QueryResult<sessionRowStructure> = await umPool.query(
			'SELECT sessiontoken, userid, useragent, issuedon, expireson, sessionid FROM sessions;'
		).catch((reason) => {
			// Basically standard error handling. Maybe I should make a standard function
			// for this.
			const error = new Error('Falied to initialise session cache.');
			error.cause = reason || 'Call to PostgreSQL failed for unknown reason.';
			throw error;
		});

		// For each session that exists...

		rawSessionQuery.rows.forEach(async (value) => {
			// Pack it all into a session object...
			const salt = await bcrypt.genSalt(12);
			const hashedSessionToken = await bcrypt.hash(value.sessiontoken, salt);
			const session = new Session(
				this.bgCore,
				value.sessionid,
				hashedSessionToken,
				salt,
				value.useragent,
				this.bgCore.userInventory.getUserByID(value.userid)!,
				value.issuedon,
				value.expireson,
				this.deleteSession,
			);

			// And allocate it into the session cache.
			this.sessionMap.set(session.id, session);
		});
	}

	/**
	 * Callback function for if a session has been updated.
	 */
	private async sessionUpdateCallback(sessionID : string) {
		// Grab raw query result from PostgreSQL.
		const sessionDataRaw : QueryResult<sessionRowStructure> =
			await umPool.query('SELECT * FROM sessions WHERE sessionid=$1;', [sessionID])
			// You never know what could happen...
			.catch((reason) => {
				const error = new Error('Something went wrong when getting a session from PostgreSQL.');
				error.cause = reason || 'Call to PostgreSQL failed for unknown reason.';
				throw error;
			});

		// If the database no longer shows a session then delete it from cache.
		if (!sessionDataRaw.rows.length) {
			this.sessionMap.delete(sessionID);
			return;
		}

		// Get the session data object.

		const sessionData = sessionDataRaw.rows[0];

		// Generate salt to hash the session token for security.
		const salt = await bcrypt.genSalt(12);

		// Assign the session a spot in cache.
		this.sessionMap.set(sessionID, new Session(
			this.bgCore,
			sessionData.sessionid,
			await bcrypt.hash(sessionData.sessiontoken, salt),
			salt,
			sessionData.useragent,
			this.bgCore.userInventory.getUserByID(sessionData.userid)!,
			sessionData.issuedon,
			sessionData.expireson,
			this.deleteSession,
		));
	}

	/**
	 * Check a session token against the internal cache.
	 * @param sessionToken Token to check against sessions.
	 */
	public async checkToken(sessionToken : string) : Promise<User | null> {
		// Variable to be assigned if the for loop matches a user.
		let foundUser : User | null = null;

		// For each key in the map...
		for (const sessionID in this.sessionMap) {
			// Get the session object...
			const session = this.sessionMap.get(sessionID)!;
			// Generate the hashed token in a way that will return true when compared.
			const hashedToken = await bcrypt.hash(sessionToken, session.salt);
			if (session.compareToken(hashedToken)) {
				// If the token is a match, then return the correct user.
				foundUser = session.user;
			}
		}

		return foundUser;
	}

	/**
	 * Delete a session from cache and from the database. Intended for use when a session
	 * expires or to log out.
	 * @param session The session to purge from the database.
	 */
	public async deleteSession(session : Session) {

		if (!this.sessionMap.has(session.id)) {
			throw new Error('Attempted to delete non existent session.', {
				// Construct a cause with a bunch of details.
				cause: {
					sessionID: session.id,
					sessionExpiry: session.expires.toISOString(),
					sessionIssue: session.issued.toISOString(),
					sessionUserID: session.user.id,
					sessionUserAgent: session.userAgent,
				}
			});
		}

		// Query the database to additionally remove the session from there.
		await umPool.query('DELETE FROM sessions WHERE sessionid=$1;', [session.id]);

		// If the session has been removed from the database, then the callback function
		// for updating sessions will deal with removing it from cache.
		// Removing the session from cache and notifying the event system of an update may
		// lead to issues where the sessionUpdateCallback is trying to find and remove non
		// existent sessions.

		this.bgCore.cacheInvalidation.notifyUpdate(possibleEvents.session, session.id);
	}

	/**
	 * Attempt to log in a user. On the API side, it may be advisable to artificially
	 * delay responses to login attempts.
	 * @param user The user object being authenticated.
	 * @param password The password of the user.
	 * @returns Returns either a token or an error.
	 */

	public async authenticateUser(
		user : User, password : string, userAgent : string, ipAddress : string
	): Promise<string | Error> {
		// Check user exists.
		if (!this.bgCore.userInventory.getUserByID(user.id)) {
			throw new Error('Attempted to authenticate non existent user.', {
				cause: user,
			});
		}

		// Interface for password and salt.
		interface passSaltStruct {
			pass: string;
			salt: string;
		}

		// Grab user data from database.
		// This class avoids holding this data in memory for longer than required to
		// prevent security where a user may get access to a cache of hashed passwords.
		const userData : passSaltStruct = (await umPool.query('SELECT pass, salt FROM users WHERE userid=$1;', [user.id]).catch((reason) => {
			// Catch error incase DB query goes wrong.
			throw Error('Something has gone wrong with fetching user authentication details. User that exists in cache not present in database.', {
				cause: {
					userObject: user,
					reason: reason,
				},
			});
		})).rows[0]; // The first row will be correct.

		const passwordCorrect =
			await bcrypt.hash(password, userData.salt) === userData.pass;
		
		// Insert a record of the login attempt to the database.
		await umPool.query('INSERT INTO loginattempts (userid, successful, ipaddress, useragent) VALUES ($1, $2, $3, $4);',
		[user.id, passwordCorrect, ipAddress, userAgent] // With the parameters.
		);

		if (passwordCorrect) {
			const token = await bcrypt.hash(crypto.randomUUID(), 30);
			const id = generateID();

			await umPool.query(
				'INSERT INTO sessions (sessiontoken, userid, useragent, issuedon, expireson, sessionid) VALUES ($1, $2, $3, $4, $5, $6);',
				[
					token,
					user.id,
					userAgent,
					new Date(),
					// Session life of 2 weeks.
					new Date(Date.now() + (1000 * 60 * 60 * 24 * 14)),
					id
				]
			);

			this.bgCore.cacheInvalidation.notifyUpdate(possibleEvents.session, id);

			return token;
		} else {
			// It wouldn't really make sense to throw an error for every single failed
			// authentication attempt.
			const error = new Error('Incorrect authentication details.');
			return error;
		}
	}

	// Create/Delete a user.
}

export default UserManagerInventory;