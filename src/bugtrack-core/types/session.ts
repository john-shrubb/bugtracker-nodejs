import BugtrackCore from '../index.js';
import User from './user.js';

/**
 * Used to represent a session.
 * When attempting to authenticate sessions, the user agents must be similar or identical
 * as a layer of defence against session token theft.
 */
class Session {
	/**
	 * @param bgCore Instance of bg-core. Used for data retrieval.
	 * @param id The ID used to reference the session.
	 * @param token The token used to authenticate the session. This token should be
	 *              hashed.
	 * @param userAgent The user agent used to authenticate the session.
	 * @param user The user whom the session is used to access.
	 * @param issued The date the session was issued.
	 * @param expires The date of expiration for the session. Expiration is automatic.
	 * @param onExpire The callback for when the session expires.
	 */
	constructor(
		private bgCore    : BugtrackCore,
		public  id        : string,
		public  token     : string,
		public  userAgent : string,
		public  user      : User,
		public  issued    : Date,
		public  expires   : Date,
		onExpire          : (session : Session) => void,
	) {
		// Set a timer which will call a function inside of the userManagerInventory to
		// notify it that the session has expired.
		setTimeout(() => onExpire(this), expires.getTime() - Date.now());
	}
}

export default Session;