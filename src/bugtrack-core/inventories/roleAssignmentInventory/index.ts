import BugtrackCore from '../../index.js';
import Role from '../../types/role.js';
import initialiseRoleAssignmentCache from './core/initialiseRoleAssignmentCache.js';
import roleAssignmentUpdateCallback from './core/roleAssignmentUpdateCallback.js';
import getRoleAssignmentsByProjectID from './specific/getRoleAssignmentsByProjectID.js';
import assignRole from './specific/assignRole.js';
import unassignRole from './specific/unassignRole.js';
import noCacheGetRoleByMemberID from './specific/noCacheGetRoleByMemberID.js';

/**
 * The RoleAssignmentInventory class is used to act as a data access layer for CRUD
 * operations relating to role assignments. To create and remove roles, see
 * [RoleInventory](./roleInventory.ts).
 */
class RoleAssignmentInventory {
	constructor(
		private bgCore: BugtrackCore,
	) {
		// Initialise the role assignment cache.
		this.bgCore.invReady.eventEmitter.on(
			'roleInventoryReady',
			() => initialiseRoleAssignmentCache(this.bgCore)
		);

		// Listen for role assignment updates.
		// TODO: Consider making function calls less verbose.
		this.bgCore.cacheInvalidation.eventEmitter.on(
			'roleAssignmentUpdate',
			(roleID, memberID) => this.roleAssignmentUpdateCallback(roleID, memberID)
		);
	}

	/**
	 * The map for holding all role assignments.
	 */
	private roleAssignmentMap: Map<string, Role> = new Map();

	/**
	 * Callback for a role assignment update.
	 */
	public roleAssignmentUpdateCallback = async (roleID: string, memberID: string) =>
		await roleAssignmentUpdateCallback(roleID, memberID, this.bgCore, this.roleAssignmentMap);

	/**
	 * Get all role assignments by a project.
	 * @param projectID The ID of the projects to get role assignments for.
	 * @returns An array of role assignments for the project. See the return format.
	 */
	public getRoleAssignmentsByProjectID = (projectID : string) =>
		getRoleAssignmentsByProjectID(projectID, this.bgCore, this.roleAssignmentMap);

	/**
	 * Get a project members role
	 * @param memberID The ID of the member to get the role for.
	 * @returns The appropriate role for the member, or null if they don't have a role.
	 */
	public getRoleByMemberID = (memberID: string) : Role | null =>
		this.roleAssignmentMap.get(memberID) || null;


	/**
	 * 
	 * @param memberID The ID of the member to get the role for.
	 * @returns The role assigned to the member, or null if they don't have a role.
	 */
	public noCacheGetRoleByMemberID = async (memberID: string) : Promise<Role | null> =>
		await noCacheGetRoleByMemberID(memberID, this.bgCore);

	/**
	 * Assign a role to a project member.
	 * @param roleID The ID of the role to assign.
	 * @param memberID The ID of the member to assign the role to.
	 * @param assignedByMemberID The ID of the member who is assigning the role. Their
	 *                           permissions will be checked.
	 */
	public assignRole = async (roleID: string, memberID: string, assignedByMemberID: string) =>
		await assignRole(roleID, memberID, assignedByMemberID, this.bgCore);

	/**
	 * Remove a role from a project member.
	 * @param memberID The ID of the member having their role removed.
	 * @param unassignerID The ID of the member who is removing the role.
	 */
	public unassignRole = async (memberID : string, unassignerID : string) =>
		await unassignRole(memberID, unassignerID, this.bgCore);
}

export default RoleAssignmentInventory;