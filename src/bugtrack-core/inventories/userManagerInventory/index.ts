import BugtrackCore from '../../index.js';
import Session from '../../types/session.js';
import User from '../../types/user.js';
import UserStub from '../../types/userStub.js';
import initialiseSessionCache from './core/initialiseSessionCache.js';
import sessionUpdateCallback from './core/sessionUpdateCallback.js';
import checkToken from './specific/checkToken.js';
import deleteSession from './specific/deleteSession.js';
import authenticateUser from './specific/authenticateUser.js';
import createUser from './specific/createUser.js';
import deleteUser from './specific/deleteUser.js';
import updatePassword from './specific/updatePassword.js';
import getUserStubByID from './specific/getUserStubByID.js';

/**
 * The user manager inventory provides methods to authenticate users and update security
 * information, such as passwords.
 *
 * It also keeps a private cache of all sessions, and login attempts.
 */
class UserManagerInventory {
	constructor(private bgCore: BugtrackCore) {
		// Builds session cache.
		this.initialiseSessionCache();

		// Bind the update callback to the class.
		this.sessionUpdateCallback.bind(this);

		// For if there has been an update to the cache.
		this.bgCore.cacheInvalidation.eventEmitter.on('sessionUpdate', (id: string) =>
			this.sessionUpdateCallback(id),
		);
	}

	// Session objects aren't really supposed to be passed around. Try not to expose any
	// public functions that may return a session object.

	/**
	 * Cache holding current sessions. The session token is hashed for security.
	 *
	 * Do not delete items directly from the session map, simply notify cache invalidation
	 * of the change and it will handle the rest.
	 */
	private sessionMap: Map<string, Session> = new Map();

	/**
	 * Initialises the session cache by grabbing all sessions and adding them to the array
	 * of sessions.
	 */
	private initialiseSessionCache = async () => await initialiseSessionCache(this.bgCore);

	/**
	 * Callback function for if a session has been updated.
	 */
	public sessionUpdateCallback = async (sessionID: string) =>
		await sessionUpdateCallback(sessionID, this.bgCore, this.sessionMap);

	/**
	 * Check a session token against the internal cache.
	 * @param sessionToken Token to check against sessions.
	 */
	public checkToken = async (sessionToken: string): Promise<User | null> =>
		await checkToken(sessionToken, this.sessionMap);

	/**
	 * Delete a session from cache and from the database. Intended for use when a session
	 * expires or to log out.
	 * @param session The session to purge from the database.
	 */
	public deleteSession = async (session: Session) =>
		await deleteSession(session, this.bgCore, this.sessionMap);

	/**
	 * Attempt to log in a user. On the API side, it may be advisable to artificially
	 * delay responses to login attempts.
	 * @param user The user object being authenticated.
	 * @param password The password of the user.
	 * @returns Returns either a token or an error.
	 */

	public authenticateUser = async (
		user: User,
		password: string,
		userAgent: string,
		ipAddress: string,
	): Promise<string | Error> =>
		await authenticateUser(user, password, userAgent, ipAddress, this.bgCore);

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
	public createUser = async (
		username: string,
		email: string,
		displayname: string,
		pfp: string | null,
		password: string,
	): Promise<string> =>
		await createUser(username, email, displayname, pfp, password, this.bgCore);

	/**
	 * Delete a user from the database. Cache may take a few seconds to reflect the
	 * user deletion.
	 * @param user The user that requires deletion.
	 */
	public deleteUser = async (user: User) => await deleteUser(user, this.bgCore);

	/**
	 * Update the user's password.
	 *
	 * This function will throw an error if the old password is incorrect. It is advisable
	 * to encase the use of this function in a try/catch block.
	 * @param user The user object to update the password for.
	 * @param oldPassword The old password given by the user.
	 * @param newPassword The new password to be set.
	 */
	public updatePassword = async (user: User, oldPassword: string, newPassword: string) =>
		await updatePassword(user, oldPassword, newPassword, this.bgCore);

	// Deleted users are only accessible by this class, so a method is needed to provide
	// access to user stubs.

	/**
	 * Attempt to find a deleted user and return a user stub. Undeleted users will not be
	 * returned.
	 * @param userID The ID of the user stub to retrieve.
	 */
	public getUserStubByID = async (userID: string): Promise<UserStub | null> =>
		await getUserStubByID(userID);
}

export default UserManagerInventory;
