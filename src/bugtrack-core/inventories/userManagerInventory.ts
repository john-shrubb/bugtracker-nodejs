// Apparently a decent cryptography library.
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import BugtrackCore from '../index.js';
// Imports its own umPool.
import { umPool } from '../dbConnection.js';
import Session from '../types/session.js';
import { QueryResult } from 'pg';
import { possibleEvents } from '../services/cacheInvalidationService.js';
import User from '../types/user.js';
import generateID from '../helperFunctions/genID.js';
import checkAttributeConstraint from '../helperFunctions/checkAttributeConstraint.js';
import UserAttributeType from '../types/enums/userAttributeType.js';
import UserStub from '../types/userStub.js';
import { InventoryType } from '../services/inventoryReadyService.js';

/**
 * Structure for the session rows when they are fetched from the database.
 */
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
	constructor(
		private bgCore : BugtrackCore
	) {
		// Builds session cache.
		this.initialiseSessionCache();

		// For if there has been an update to the cache.
		this.bgCore.cacheInvalidation.on('sessionUpdate', this.sessionUpdateCallback);
	}

	// Sessions.
	// These should be held closely, with session objects only being exposed to other
	// classes if they can supply correct credentials. This section of the class mainly
	// provides CRUD operations (Update isn't really appropriate for a session).

	/**
	 * Cache holding current sessions. The session token is hashed for security.
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
			const hashedSessionToken = await bcrypt.hash(value.sessiontoken, 12);
			const session = new Session(
				this.bgCore,
				value.sessionid,
				hashedSessionToken,
				value.useragent,
				this.bgCore.userInventory.getUserByID(value.userid)!,
				value.issuedon,
				value.expireson,
				this.deleteSession,
			);

			// And allocate it into the session cache.
			this.sessionMap.set(session.id, session);
		});

		// eslint-disable-next-line max-len
		this.bgCore.inventoryReadyService.inventoryReady(InventoryType.userManagerInventory);
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

		// Assign the session a spot in cache.
		this.sessionMap.set(sessionID, new Session(
			this.bgCore,
			sessionData.sessionid,
			await bcrypt.hash(sessionData.sessiontoken, 10),
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

			if (await bcrypt.compare(sessionToken, session.token)) {
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

		// Interface for password.
		interface passStruct {
			pass: string;
		}

		// Grab user data from database.
		// This class avoids holding this data in memory for longer than required to
		// prevent security where a user may get access to a cache of hashed passwords.
		const userData : passStruct = (await umPool.query('SELECT pass FROM users WHERE userid=$1;', [user.id]).catch((reason) => {
			// Catch error incase DB query goes wrong.
			throw Error('Something has gone wrong with fetching user authentication details. User that exists in cache not present in database.', {
				cause: {
					userObject: user,
					reason: reason,
				},
			});
		})).rows[0]; // The first row will always be correct.

		const passwordCorrect = await bcrypt.compare(password, userData.pass.trim());
		
		// Insert a record of the login attempt to the database.
		await umPool.query('INSERT INTO loginattempts (userid, successful, ipaddress, useragent) VALUES ($1, $2, $3, $4);',
			[user.id, passwordCorrect, ipAddress, userAgent]
		);

		if (passwordCorrect) {
			const token = await bcrypt.hash(crypto.randomUUID(), 13);
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

	// Create/Delete/Update a user.

	/**
	 * Create a new user and automatically notify the internal cache invalidation system.
	 * @param username The username of the new user.
	 * @param email The email of the new user.
	 * @param displayname The display name of the new user.
	 * @param pfp The path to the profile picture of the new user.
	 * @param password The plaintext password for the new user. Will be automatically
	 *                 hashed.
	 * @returns A string with the new account ID.
	 */
	public async createUser(
		username : string,
		email : string,
		displayname : string,
		pfp : string | null,
		password : string
	) : Promise<string> {
		// Generate the new user's ID.
		const newUserID = generateID();

		// Check that all the user attributes are of a valid format.
		if (
			!checkAttributeConstraint(username, UserAttributeType.username) ||
			!checkAttributeConstraint(email, UserAttributeType.email) ||
			!checkAttributeConstraint(displayname, UserAttributeType.displayname) ||
			!checkAttributeConstraint(pfp || '', UserAttributeType.pfp) // If PFP is null then just substitute an empty string to avoid an error.
		) {
			// Throw an error with bad strings in the cause object to help with debugging.
			throw new Error('Attempted to create user with invalid constraints.', {
				cause: {
					username: username,
					email: email,
					displayname: displayname,
					pfp: pfp,
				},
			});
		}

		if (
			this.bgCore.userInventory.getUserByUsername(username) ||
			this.bgCore.userInventory.getUserByEmail(email)
		) {
			throw new Error('Attempted to create with an already existing username or email address.');
		}

		const salt = await bcrypt.genSalt(13);
		const hashedPass = await bcrypt.hash(password, salt);

		await umPool.query(
			'INSERT INTO users (userid, username, email, displayname, pfp, pass) VALUES ($1, $2, $3, $4, $5, $6);',
			[newUserID, username, email, displayname, pfp, hashedPass],
		);

		// Notify the cache invalidation system of the new user.
		this.bgCore.cacheInvalidation.notifyUpdate(possibleEvents.user, newUserID);

		// Return an ID. Any function that needs instant access to the new user object
		// should use the no cache variant of getUserByID().
		return newUserID;
	}

	/**
	 * Delete a user from the database. Cache may take a few seconds to reflect the
	 * user deletion.
	 * @param user The user that requires deletion.
	 */
	public async deleteUser(user : User) {
		// Check that user exists so it's impossible to delete a non existent user.
		if (!this.bgCore.userInventory.getUserByID(user.id)) {
			throw new Error('Attempted to delete non existent user.', {
				cause: user,
			});
		}

		// Query DB to delete user.
		await umPool.query('UPDATE users SET deleted=$1 WHERE userid=$2;', [true, user.id]);

		// Notify cache invalidation of the user deletion.
		this.bgCore.cacheInvalidation.notifyUpdate(possibleEvents.user, user.id);
	}

	/**
	 * Update the user's password.
	 * 
	 * This function will throw an error if the old password is incorrect. It is advisable
	 * to encase the use of this function in a try/catch block.
	 * @param user The user object to update the password for.
	 * @param oldPassword The old password given by the user.
	 * @param newPassword The new password to be set.
	 */

	public async updatePassword(user : User, oldPassword : string, newPassword : string) {
		// Check that user exists.
		if (!this.bgCore.userInventory.getUserByID(user.id)) {
			throw new Error('Attempted to update password for non existent user.', {
				cause: user,
			});
		}

		// Check that the old password is correct.
		const userPassHash : string = (await umPool.query('SELECT pass FROM users WHERE userid=$1;', [user.id])).rows[0][0];

		// Compare and throw error if old password is incorrect.
		if (!await bcrypt.compare(oldPassword, userPassHash)) {
			throw new Error('Attempted to update password with incorrect old password.');
		}

		const newPassHash = await bcrypt.hash(newPassword, 13);

		// Update the password in the database.
		await umPool.query('UPDATE users SET pass=$1 WHERE userid=$2;', [newPassHash, user.id]);
	}

	// Deleted users are only accessible by this class, so a method is needed to provide
	// access to user stubs.

	/**
	 * Attempt to find a deleted user and return a user stub. Undeleted users will not be
	 * returned.
	 * @param userID The ID of the user stub to retrieve.
	 */
	public async getUserStubByID(userID : string) : Promise<UserStub | null> {
		/**
		 * Interface for how the user data will be returned from the database.
		 */
		interface UserDataStruct {
			id : string;
			displayname : string;
			username : string;
			email : string;
		}

		// Query the database.
		const userDataRaw : QueryResult<UserDataStruct> = await umPool.query('SELECT (userid, displayname, username, email) FROM users WHERE userid=$1, deleted=$2;', [userID, true]);

		// Check if there is a deleted user.
		if (!userDataRaw.rows.length) {
			return null;
		}

		const userData = userDataRaw.rows[0];

		const user = new UserStub(
			userData.id,
			userData.displayname,
			userData.username,
			userData.email,
		);

		return user;
	}
}

export default UserManagerInventory;