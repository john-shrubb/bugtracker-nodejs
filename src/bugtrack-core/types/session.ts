import BugtrackCore from '../index.js';
import User from './user.js';

/**
 * Used to represent a session.
 * When attempting to authenticate sessions, the user agents must be similar.
 */
class Session {
	constructor(
		bgCore : BugtrackCore,
		sessionID    : string,
		sessionToken : string,
		salt         : string,
		userAgent    : string,
		user         : User,
		issueDate    : Date,
		expiryDate   : Date,
		onExpire     : (session : Session) => void,
	) {
		this.bgCore = bgCore;
		this.id = sessionID;
		this.sessionToken = sessionToken;
		this.salt = salt;
		this.userAgent = userAgent;
		this.user = user;
		this.issued = issueDate;
		this.expires = expiryDate;
		// Set a timer which will call a function inside of the userManagerInventory to
		// notify it that the session has expired.
		setTimeout(() => onExpire(this), expiryDate.getTime() - Date.now());
	}

	/**
	 * Instance of the core bugtracker class.
	 */
	private bgCore;

	/**
	 * The ID used to reference the session.
	 */
	public id;

	/**
	 * The token tied to the user's session.
	 */
	private sessionToken;

	/**
	 * Salt associated with hashed session token. Can be left blank if session token
	 * wasn't hashed (Not recommended).
	 */

	public salt;

	/**
	 * The user agent tied to the session.
	 */
	public readonly userAgent;

	/**
	 * The user tied to the session.
	 */
	public user;

	/**
	 * The issue date of the session token.
	 */
	public issued;

	/**
	 * When the session token expires.
	 */
	public readonly expires;

	/**
	 * Compares whether a session token is equivelant to the one in this class.
	 * @param token Session token to compare.
	 * @returns True if the session token is valid.
	 */
	public compareToken(token : string) : boolean {
		return this.sessionToken === token;
	}
}

export default Session;