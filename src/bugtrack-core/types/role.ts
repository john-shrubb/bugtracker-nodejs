import ProjectMember from './projectMember';

/**
 * Used to represent a role in a project.
 */
class Role {
	/**
	 * @param roleID The ID of the project role.
	 * @param name   The display name of the project role.
	 * @param permissionInt The permission int specifying the permissions granted to the
	 *                      role.
	 * @param displayTag Whether the role is displayed on the client.
	 */
	constructor(
		roleID : string,
		name : string,
		permissionInt : number,
		displayTag : boolean,
	) {
		this.id = roleID;
		this.name = name;
		this.permissionBits = permissionInt;
		this.displayTag = displayTag;
	}

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