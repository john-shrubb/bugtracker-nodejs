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
		bugtrackCore   : BugtrackCore,
		projectID      : string,
		name           : string,
		owner          : User,
		tickets        : Map<string, Ticket>,
		projectMembers : Map<string, ProjectMember>,
		creationDate   : Date,
	) {
		this.bgCore = bugtrackCore;

		// Check format of project ID.
		if (!checkID(projectID)) {
			throw new Error('Attempted to create new Project with invalid project ID');
		}

		this.id = projectID;
		this.name = name;
		this.owner = owner;
		this.tickets = tickets;
		this.projectMembers = projectMembers;
		this.createdOn = creationDate;
	}

	/**
	 * Instance of the core bugtracker class.
	 */
	private bgCore;

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
	 * All the tickets which are a part of this project. The ID for each ticket is used as
	 * a key.
	 */

	public tickets;

	/**
	 * All members of the project. The ID of each project member is used as the key.
	 */

	public projectMembers;

	/**
	 * When the project was created.
	 */
	public createdOn;
}

export default Project;