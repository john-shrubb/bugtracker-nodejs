import checkID from '../helperFunctions/checkID.js';
import BugtrackCore from '../index.js';
import ProjectMember from './projectMember.js';

/**
 * Used to represent a role in a project. Roles represent a user's status and permission
 * level within a project, with roles being able to have different sets of permissions
 * such as assigning users to a ticket, adding and removing users and changing the status
 * of a ticket.
 */
class Role {
	/**
	 * @param bgCore Instance of bugtrack core used for data retrieval.
	 * @param id The ID used to reference the role.
	 * @param name The name of the role.
	 * @param permissionInt The integer representation of the permission bits.
	 * @param colour The colour of the role displayed to other users.
	 * @param displayTag Whether a tag is displayed next to the users with the role.
	 */
	constructor(
		private bgCore        : BugtrackCore,
		public  id            : string,
		public  name          : string,
		public  permissionInt : number,
		public  colour        : string,
		public  displayTag    : boolean,
	) {
		// Check format of role ID.
		if (!checkID(id)) {
			throw new Error('Attempted to create Role with invalid role ID.');
		}
	}

	/**
	 * Get all users with the role.
	 */

	public getUsersWithRole() : Array<ProjectMember> {
		return [];
	}
}

export default Role;