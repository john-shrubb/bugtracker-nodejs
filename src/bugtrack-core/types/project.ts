import checkID from '../helperFunctions/checkID.js';
import BugtrackCore from '../index.js';
import ProjectMember from './projectMember.js';
import Ticket from './ticket.js';
import User from './user.js';

/**
 * Represents an overall project in the bug tracker.
 */
class Project {
	constructor(
		bugtrackCore : BugtrackCore,
		projectID    : string,
		name         : string,
		owner        : User,
		creationDate : Date,
	) {
		this.bugtrackCore = bugtrackCore;

		// Check format of project ID.
		if (!checkID(projectID)) {
			throw new Error('Attempted to create new Project with invalid project ID');
		}

		this.id = projectID;
		this.name = name;
		this.owner = owner;
		this.createdOn = creationDate;
	}

	/**
	 * Instance of the core bugtracker class.
	 */
	private bugtrackCore;

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