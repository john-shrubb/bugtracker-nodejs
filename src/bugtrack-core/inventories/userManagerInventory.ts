// Apparently a decent cryptography library.
import bcrypt from 'bcrypt';
import BugtrackCore from '../index.js';
// Imports its own umPool.
import { umPool } from '../dbConnection.js';
import Session from '../types/session.js';
import { QueryResult } from 'pg';
import { possibleEvents } from '../services/cacheInvalidationService.js';
import User from '../types/user.js';

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
		let foundUser : User | null = null;
		for (const sessionID in this.sessionMap) {
			const session = this.sessionMap.get(sessionID)!;
			const hashedToken = await bcrypt.hash(sessionToken, session.salt);
			if (session.compareToken(hashedToken)) {
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
}

export default UserManagerInventory;