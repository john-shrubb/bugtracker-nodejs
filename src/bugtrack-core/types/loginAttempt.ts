import BugtrackCore from '../index.js';
import User from './user.js';

/**
 * Represents an attempt to login to the bug tracker system.
 */

class LoginAttempt {
	/**
	 * @param bgCore The instance of bg-core. Will be used for data retreival.
	 * @param user The user the client attempted to login as.
	 * @param date The date the attempt was made.
	 * @param successful Whether the client managed to log in or not.
	 * @param ipAddress The IP address the attempt was made from.
	 * @param userAgent The user agent of the client.
	 */
	constructor(
		private bgCore       : BugtrackCore,
		public  user         : User,
		public  date         : Date,
		public  successful   : boolean,
		public  ipAddress    : string,
		public  userAgent    : string,
	) {
	}
}

export default LoginAttempt;