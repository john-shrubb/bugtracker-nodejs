import checkID from '../helperFunctions/checkID.js';
import BugtrackCore from '../index.js';
import Project from './project.js';
import Role from './role.js';
import Ticket from './ticket.js';
import User from './user.js';

/**
 * Represents a user in the context of a project.
 */

class ProjectMember {
	/**
	 * @param bgCore The instance of bg-core used for data retrieval.
	 * @param id The ID used to reference the member. This ID is seperate to the user ID.
	 * @param user The user associated with the project membership.
	 * @param project The project associated with the membership.
	 * @param role The role of the project member.
	 * @param joinedOn When the user joined the project.
	 */
	constructor(
		private bgCore   : BugtrackCore,
		public  id       : string,
		public  user     : User,
		public  project  : Project,
		public  role     : Role,
		public  joinedOn : Date,
	) {
		// Check format of member ID.
		if (!checkID(id)) {
			throw new Error('Attempted to create ProjectMember with invalid member ID.');
		}
	}

	/**
	 * Grabs all the tickets the user created in the context of the current project.
	 * @returns An array with all of the tickets the user has created.
	 */
	public getTickets() : Array<Ticket> {
		return [];
	}

	/**
	 * Grab all the comments the user has made in the project.
	 * @returns The an array of comments the user has left on tickets across the project.
	 */
	public getComments() : Array<Comment> {
		return [];
	}
}

export default ProjectMember;