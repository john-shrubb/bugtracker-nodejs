import Project from './project';
import Role from './role';
import Ticket from './ticket';
import User from './user';

/**
 * Represents a user in the context of a project.
 */

class ProjectMember {
	constructor(
		memberID : string,
		user     : User,
		project  : Project,
		role     : Role,
		joinedOn : Date,
	) {
		this.memberID = memberID;
		this.user = user;
		this.project = project;
		this.role = role;
		this.joined = joinedOn;
	}

	/**
	 * The user's member ID used to link them with the project.
	 */
	public memberID;
	
	/**
	 * The user class linked to the member.
	 */
	public user;

	/**
	 * The project the user is a member of.
	 */
	public project;

	/**
	 * The user's role.
	 */
	public role;

	/**
	 * When the user joined the project.
	 */
	public joined;

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