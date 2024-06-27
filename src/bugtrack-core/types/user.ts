import checkID from '../helperFunctions/checkID.js';
import BugtrackCore from '../index.js';
import ProjectMember from './projectMember.js';

/**
 * A class used to represent users within the bug tracker system.
 */
class User {
	/**
	 * @param bgCore Instance of bg-core. Used for data retrieval.
	 * @param id The ID used to reference the user.
	 * @param username The username used by other users to reference the user.
	 * @param email The email address tied to the user.
	 * @param displayName The name of the user shown to other users.
	 * @param pfp The URL to the user's profile picture.
	 * @param creationDate The date the user was created.
	 */
	constructor(
		private bgCore       : BugtrackCore,
		public  id           : string,
		public  username     : string,
		public  email        : string,
		public  displayName  : string,
		public  pfp          : string,
		public  creationDate : Date,
	) {
		// Check the format of the user ID.
		if (!checkID(id)) {
			throw Error('Attempted to create User with invalid user ID.');
		}
	}
	// Functions

	/**
	 * Get the projects the user is in.
	 * @returns An array of the ProjectMember class, in the context of this user.
	 */
	public getProjects() : Array<ProjectMember> {
		return [];
	}
}

export default User;