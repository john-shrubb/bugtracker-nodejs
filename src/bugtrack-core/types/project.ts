import ProjectMember from './projectMember';
import Ticket from './ticket';
import User from './user';

/**
 * Represents an overall project in the bug tracker.
 */
class Project {
	constructor(
		projectID : string,
		name      : string,
		owner     : User,
		creationDate : Date,
	) {
		this.id = projectID;
		this.name = name;
		this.owner = owner;
		this.createdOn = creationDate;
	}

	/**
	 * ID used to reference the project.
	 */
	public id;

	/**
	 * The name/title of the project.
	 */
	public name;

	/**
	 * The user whom the project belongs to.
	 */
	public owner;

	/**
	 * When the project was created.
	 */
	public createdOn;

	// Functions

	/**
	 * Function to grab all project members from the project and return
	 * @returns An array with all project members associated with the project.
	 */
	public getAllProjectMembers() : Array<ProjectMember> {
		return [];
	}

	/**
	 * A function to get all the tickets in the project.
	 * @returns An array with all the tickets created in this project.
	 */
	public getAllTickets() : Array<Ticket> {
		return [];
	}

	/**
	 * Grabs a ticket object by it's ID.
	 * @param ticketID The ID of the ticket object.
	 * @returns A ticket object with the referenced ID.
	 */
	public getTicketByID(ticketID : string) : void {
		ticketID;
		return;
	}
}

export default Project;