import checkID from '../helperFunctions/checkID.js';
import BugtrackCore from '../index.js';
import ProjectMember from './projectMember.js';
import Ticket from './ticket.js';
import UserStub from './userStub.js';

/**
 * Represents a comment made on a ticket.
 */
class Comment {
	/**
	 * @param bgCore The primary instance of bg-core. Will be used for data retrieval.
	 * @param id The ID used to reference the comment.
	 * @param author The author of the comment.
	 * @param content The content of the comment.
	 * @param ticket The ticket the comment was made under.
	 * @param createdOn When the comment was made.
	 */
	constructor(
		private bgCore: BugtrackCore,
		public id: string,
		public author: ProjectMember | UserStub,
		public content: string,
		public ticket: Ticket,
		public createdOn: Date,
	) {
		this.bgCore = bgCore;

		// Check format of comment ID.
		if (!checkID(id)) {
			throw new Error('Attempted to create Comment with invalid comment ID.');
		}
	}
}

export default Comment;
