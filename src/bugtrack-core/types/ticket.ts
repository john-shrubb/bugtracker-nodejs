import checkID from '../helperFunctions/checkID.js';
import BugtrackCore from '../index.js';
import Comment from './comment.js';
import TicketPriority from './enums/ticketPriority.js';
import TicketStatus from './enums/ticketStatus.js';
import ProjectMember from './projectMember.js';
import Tag from './tag.js';

/**
 * Used to represent a ticket.
 */

class Ticket {
	constructor(
		bugtrackCore           : BugtrackCore,
		ticketID               : string,
		author                 : ProjectMember,
		priority               : TicketPriority,
		status                 : TicketStatus,
		tags                   : Array<Tag>,
		assignedProjectMembers : Array<ProjectMember>,
		ticketTitle            : string,
		ticketDescription      : string,
		attachments            : string,
		createdOn              : Date,
	) {
		this.bugtrackCore = bugtrackCore;

		// Check the format of the passed ID.
		if (!checkID(ticketID)) {
			throw new Error(
				'Attempted to create a ticket with an invalid ticket ID format.'
			);
		}

		this.id = ticketID;
		this.author = author;
		this.priority = priority;
		this.status = status;
		this.tags = tags;
		this.assignedMembers = assignedProjectMembers;
		this.title = ticketTitle;
		this.description = ticketDescription;
		this.attachments = attachments;
		this.opened = createdOn;
	}

	/**
	 * Instance of the core bugtracker class.
	 */
	private bugtrackCore;

	/**
	 * The ID used to reference the ticket.
	 */
	public id;

	/**
	 * The author of the ticket.
	 */
	public author;

	/**
	 * The priority of the ticket. Represented via an enumerator.
	 */
	public priority;

	/**
	 * The status of the ticket. Represented via an enumarator.
	 */
	public status;

	/**
	 * The tags assigned to the ticket.
	 */
	public tags;

	/**
	 * The project members assigned to view the ticket.
	 * Being assigned does not specifically allow the member to comment on the ticket.
	 * See documentation on permissions and permission bit structure for details.
	 */
	public assignedMembers;

	/**
	 * The title of the ticket.
	 */
	public title;

	/**
	 * The description/content of the ticket.
	 */
	public description;

	/**
	 * The URLs for the attachments of the tickets.
	 */
	public attachments;

	/**
	 * When the ticket was opened.
	 */
	public opened;

	/**
	 * Get all the comments created for the ticket.
	 * @returns An array of all the comments on the ticket.
	 */
	public getComments() : Array<Comment> {
		return [];
	}
}

export default Ticket;