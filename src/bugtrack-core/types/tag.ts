import checkID from '../helperFunctions/checkID.js';
import BugtrackCore from '../index.js';
import Project from './project.js';
import Ticket from './ticket.js';

class Tag {
	/**
	 * @param bgCore Instance of bg-core. Used for data retrieval.
	 * @param id The ID used to reference the tag.
	 * @param name The name of the tag such as "Security Related".
	 * @param project The project the tag is tied down.
	 * @param colour 6 digit hex colour code representation of the tag colour.
	 */
	constructor(
		private bgCore  : BugtrackCore,
		public  id      : string,
		public  name    : string,
		public  project : Project,
		public  colour  : string,
	) {
		// Check format of tag ID.
		if (!checkID(id)) {
			throw new Error('Attempted to create Tag with invalid tag ID.');
		}
	}

	public getTicketsWithTag() : Array<Ticket> {
		return [];
	}
}

export default Tag;