import checkID from '../helperFunctions/checkID.js';
import BugtrackCore from '../index.js';
import ProjectMember from './projectMember.js';

/**
 * Used to represent a role in a project.
 */
class Role {
	constructor(
		bgCore  : BugtrackCore,
		roleID        : string,
		name          : string,
		permissionInt : number,
		displayTag    : boolean,
	) {
		this.bgCore = bgCore;

		// Check format of role ID.
		if (!checkID(roleID)) {
			throw new Error('Attempted to create Role with invalid role ID.');
		}

		this.id = roleID;
		this.name = name;
		this.permissionBits = permissionInt;
		this.displayTag = displayTag;
	}

	/**
	 * Instance of the core bugtracker class.
	 */
	private bgCore;

	/**
	 * The ID used to reference the role.
	 */
	public id;
	
	/**
	 * The display name of the role shown to other users.
	 */
	public name;

	/**
	 * The permission bits making up the role.
	 */
	public permissionBits;

	/**
	 * Whether the role is shown next to the user's name when they are displayed.
	 */
	public displayTag;

	/**
	 * Get all users with the role.
	 */

	public getUsersWithRole() : Array<ProjectMember> {
		return [];
	}
}

export default Role;