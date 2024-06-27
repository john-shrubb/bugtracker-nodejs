import checkID from '../helperFunctions/checkID.js';
import BugtrackCore from '../index.js';
import ProjectMember from './projectMember.js';
import Ticket from './ticket.js';
import User from './user.js';
import UserStub from './userStub.js';

/**
 * Represents an overall project in the bug tracker.
 */
class Project {
	/**
	 * @param bgCore Instance of bg-core for data retrieval.
	 * @param id The ID used to reference the project.
	 * @param name The name of the project.
	 * @param owner The user who is the owner/authro of the project.
	 * @param tickets The tickets made under the project.
	 * @param members The project members.
	 * @param createdOn When the project was created.
	 */
	constructor(
		private bgCore    : BugtrackCore,
		public  id        : string,
		public  name      : string,
		public  owner     : User | UserStub,
		public  tickets   : Array<Ticket>,
		public  members   : Array<ProjectMember>,
		public  createdOn : Date,
	) {
		// Check format of project ID.
		if (!checkID(id)) {
			throw new Error('Attempted to create new Project with invalid project ID');
		}
	}
}

export default Project;