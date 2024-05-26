import User from './user';

/**
 * Represents an attempt to login to the bug tracker system.
 */

class LoginAttempt {
	constructor(
		user       : User,
		date       : Date,
		successful : boolean,
		ipAddress  : string,
		userAgent  : string,
	) {
		this.user = user;
		this.date = date;
		this.successful = successful;
		this.ip = ipAddress;
		this.userAgent = userAgent;
	}

	/**
	 * The user the client attempted to log in as
	 */
	public user;

	/**
	 * The date of the login attempt.
	 */
	public date;

	/**
	 * Whether the user successfully logged in
	 */
	public successful;

	/**
	 * The IP address tied to the attempt.
	 */
	public ip;

	/**
	 * The user agent of the client that attempted to log in.
	 */
	public userAgent;
}

export default LoginAttempt;