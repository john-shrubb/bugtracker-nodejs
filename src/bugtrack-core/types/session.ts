import BugtrackCore from '../index.js';
import User from './user.js';

/**
 * Used to represent a session.
 * When attempting to authenticate sessions, the user agents must be similar.
 */
class Session {
	constructor(
		bugtrackCore : BugtrackCore,
		sessionToken : string,
		salt         : string | null,
		userAgent    : string,
		user         : User,
		issueDate    : Date,
		expiryDate   : Date,
		onExpire     : (session : Session) => void,
	) {
		this.bugtrackCore = bugtrackCore;
		this.sessionToken = sessionToken;
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
	private bugtrackCore;

	/**
	 * The token tied to the user's session.
	 */
	private sessionToken;

	/**
	 * Salt associated with hashed session token. Can be left blank if session token
	 * wasn't hashed (Not recommended).
	 */

	public salt = null;

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