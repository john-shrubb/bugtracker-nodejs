import checkID from '../helperFunctions/checkID.js';
import BugtrackCore from '../index.js';
import ProjectMember from './projectMember.js';
import Ticket from './ticket.js';

/**
 * Represents a comment made on a ticket.
 */
class Comment {
	constructor(
		bgCore : BugtrackCore,
		commentID : string,
		commentAuthor : ProjectMember,
		content : string,
		ticket : Ticket,
		creationDate : Date,
	) {
		this.bgCore = bgCore;

		// Check format of comment ID.
		if (!checkID(commentID)) {
			throw new Error('Attempted to create Comment with invalid comment ID.');
		}

		this.id = commentID;
		this.author = commentAuthor;
		this.content = content;
		this.ticket = ticket;
		this.createdOn = creationDate;
	}

	/**
	 * Instance of the core bugtracker class.
	 */
	private bgCore;

	/**
	 * The ID used to reference the comment.
	 */
	public id;

	/**
	 * The author of the comment.
	 */
	public author;

	/**
	 * The content of the comment.
	 */
	public content;

	/**
	 * The ticket the comment was posted on.
	 */
	public ticket;

	/**
	 * When the comment was posted onto the ticket.
	 */
	public createdOn;
}

export default Comment;