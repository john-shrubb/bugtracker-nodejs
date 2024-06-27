import checkID from '../helperFunctions/checkID.js';
import BugtrackCore from '../index.js';
import Comment from './comment.js';
import TicketPriority from './enums/ticketPriority.js';
import TicketStatus from './enums/ticketStatus.js';
import ProjectMember from './projectMember.js';
import Tag from './tag.js';
import UserStub from './userStub.js';

/**
 * Used to represent a ticket.
 */

class Ticket {
	/**
	 * @param bgCore Instance of bg-core. Used for data retrieval.
	 * @param id The ID used to reference the ticket.
	 * @param author The author of the ticket.
	 * @param priority The priority of the ticket.
	 * @param status The status of the ticket.
	 * @param tags The tags associated with the ticket.
	 * @param assignedMembers The members assigned to the ticket.
	 * @param ticketTitle The title of the ticket.
	 * @param ticketDescription The description/content of the ticket.
	 * @param attachments The URLs of the attachments.
	 * @param comments The comments made under the ticket.
	 * @param createdOn The date the ticket was created on.
	 */
	constructor(
		private bgCore            : BugtrackCore,
		public  id                : string,
		public  author            : ProjectMember | UserStub,
		public  priority          : TicketPriority,
		public  status            : TicketStatus,
		public  tags              : Array<Tag>,
		public  assignedMembers   : Array<ProjectMember>,
		public  ticketTitle       : string,
		public  ticketDescription : string,
		public  attachments       : Array<string>,
		public  comments          : Array<Comment>,
		public  createdOn         : Date,
	) {
		// Check the format of the passed ID.
		if (!checkID(id)) {
			throw new Error(
				'Attempted to create a ticket with an invalid ticket ID format.'
			);
		}
	}
}

export default Ticket;