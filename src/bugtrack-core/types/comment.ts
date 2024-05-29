import ProjectMember from './projectMember.js';
import Ticket from './ticket.js';

/**
 * Represents a comment made on a ticket.
 */
class Comment {
	constructor(
		commentID : string,
		commentAuthor : ProjectMember,
		content : string,
		ticket : Ticket,
		creationDate : Date,
	) {
		this.id = commentID;
		this.author = commentAuthor;
		this.content = content;
		this.ticket = ticket;
		this.createdOn = creationDate;
	}

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