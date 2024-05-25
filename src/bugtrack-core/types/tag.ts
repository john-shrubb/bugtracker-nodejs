import Project from './project';
import Ticket from './ticket';

class Tag {
	constructor(
		tagID : string,
		name : string,
		parentProject : Project,
		colour : string,
	) {
		this.id = tagID;
		this.name = name;
		this.project = parentProject;
		this.colour = colour;
	}

	public id;
	public name;
	public project;
	public colour;

	public getTicketsWithTag() : Array<Ticket> {
		return [];
	}

	static from(tagID : string) {
		tagID;
		return;
	}
}

export default Tag;