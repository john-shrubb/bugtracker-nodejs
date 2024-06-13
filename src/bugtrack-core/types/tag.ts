import checkID from '../helperFunctions/checkID.js';
import BugtrackCore from '../index.js';
import Project from './project.js';
import Ticket from './ticket.js';

class Tag {
	constructor(
		bgCore  : BugtrackCore,
		tagID         : string,
		name          : string,
		parentProject : Project,
		colour        : string,
	) {
		this.bgCore = bgCore;

		// Check format of tag ID.
		if (!checkID(tagID)) {
			throw new Error('Attempted to create Tag with invalid tag ID.');
		}

		this.id = tagID;
		this.name = name;
		this.project = parentProject;
		this.colour = colour;
	}

	/**
	 * Instance of the core bugtracker class.
	 */
	private bgCore;

	/**
	 * The ID used to reference the tag.
	 */
	public id;

	/**
	 * The name of the tag.
	 */
	public name;
	
	/**
	 * The project the tag is tied to.
	 */
	public project;

	/**
	 * 6 character hexadecimal representation of the colour of the tag.
	 */
	public colour;

	public getTicketsWithTag() : Array<Ticket> {
		return [];
	}
}

export default Tag;