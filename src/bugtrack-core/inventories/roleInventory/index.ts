import BugtrackCore from '../../index.js';
import { InventoryType } from '../../services/inventoryReadyService.js';
import Role from '../../types/role.js';
import initialiseRoleCache from './core/initialiseRoleCache.js';
import roleUpdateCallback from './core/roleUpdateCallback.js';
import noCacheGetRoleByID from './specific/noCacheGetRoleByID.js';
import getRolesByProjectID from './specific/getRolesByProjectID.js';
import memberHasPermission from './specific/memberHasPermission.js';
import createRole from './specific/createRole.js';
import deleteRole from './specific/deleteRole.js';
import updateRolePermission from './specific/updateRolePermission.js';
import updateRoleName from './specific/updateRoleName.js';
import updateRoleColour from './specific/updateRoleColour.js';

/**
 * Responsible for the implementations of roles in the system. Roles are used to represent
 * someone's status within a project and how many permissions they have.
 *
 * This inventory is also responsible for (un)assigning roles to a project member.
 */
class RoleInventory {
	constructor(private bgCore: BugtrackCore) {
		// Bind 'this' to callback function.
		this.roleUpdateCallback.bind(this);

		// Callback for role object updates.
		this.bgCore.cacheInvalidation.eventEmitter.on('roleUpdate', (id: string) =>
			this.roleUpdateCallback(id),
		);

		// Initialise the cache.
		this.initialiseRoleCache();
	}

	/**
	 * The map of all the roles.
	 */
	private roleMap: Map<string, Role> = new Map();

	/**
	 * Shorthand and more simple way to check if the role inventory is ready for use.
	 */
	get invReady(): boolean {
		return this.bgCore.invReady.isInventoryReady(InventoryType.roleInventory);
	}

	/**
	 * Initialise the cache of all roles in the database.
	 */
	public initialiseRoleCache = async () => await initialiseRoleCache(this.bgCore);

	/**
	 * Callback for a role update. Has to be public to allow the role initialiser method
	 * to call it.
	 */
	public roleUpdateCallback = async (roleID: string) =>
		await roleUpdateCallback(roleID, this.bgCore, this.roleMap);

	/**
	 * Get a role by it's ID.
	 * @param roleID The ID of the role to get.
	 * @returns The role object, or null if it doesn't exist.
	 */
	public getRoleByID = (roleID: string): Role | null => this.roleMap.get(roleID) || null;

	/**
	 * No cache version of getRoleByID. Useful if you need a literally completely up to
	 * date role object, for example if you have just updated the role object and need to
	 * use that.
	 * @param roleID The ID of the role to get.
	 * @returns The role object, or null if it doesn't exist.
	 */
	public noCacheGetRoleByID = async (roleID: string): Promise<Role | null> =>
		await noCacheGetRoleByID(roleID, this.bgCore);

	/**
	 * Get all roles created under a project.
	 * @param projectID The ID of the project to find roles for.
	 * @returns An array of roles under the project. If there are no roles, then an empty
	 *          array is returned.
	 */
	public getRolesByProjectID = (projectID: string): Role[] =>
		getRolesByProjectID(projectID, this.roleMap);

	// getRoleByProjectMemberID is roleAssignmentInventory's responsibility now.

	/**
	 * Check if a member has permission to perform an action. You should pass the
	 * permissionInt argument using [PermissionIntMasks](../types/permissionIntMasks.ts).
	 * @param memberID The ID of the member to check permissions for.
	 * @param permissionInt The permission integer to check against.
	 * @returns True if the member has permission, false if they don't.
	 */
	public memberHasPermission = (memberID: string, permissionInt: number) =>
		memberHasPermission(memberID, permissionInt, this.bgCore);

	/**
	 * Create a new role under a project.
	 * @param name The name of the role.
	 * @param colour The colour of the role.
	 * @param displayTag Whether the role should display a tag next to members with it.
	 * @param projectID The ID of the project to create the role under.
	 */
	public createRole = async (
		name: string,
		colour: string,
		displayTag: boolean,
		projectID: string,
	) => await createRole(name, colour, displayTag, projectID, this.bgCore);

	public deleteRole = async (roleID: string, deleterID: string) =>
		await deleteRole(roleID, deleterID, this.bgCore);

	/**
	 * Update a role's permission. This can be used to add or remove permissions from a
	 * role.
	 * @param roleID The ID of the role to update.
	 * @param permissionMask The integer mask of the permission to update.
	 * @param updaterID The ID of the member updating the role.
	 * @param addingPermission Whether the permission is being added to the role or
	 *                         removed. Defaults to true.
	 */
	public updateRolePermission = async (
		roleID: string,
		permissionMask: number,
		updaterID: string,
		addingPermission = true,
	) =>
		// eslint-disable-next-line max-len
		await updateRolePermission(
			roleID,
			permissionMask,
			updaterID,
			addingPermission,
			this.bgCore,
		);

	/**
	 * Update the name of a role.
	 * @param roleID The ID of the role to update.
	 * @param newName The new name of the role.
	 * @param updaterID The ID of the member updating the role.
	 */
	public updateRoleName = async (roleID: string, newName: string, updaterID: string) =>
		await updateRoleName(roleID, newName, updaterID, this.bgCore);

	/**
	 * Update the colour of a role.
	 * @param roleID The ID of the role to update.
	 * @param newColour The new colour of the role.
	 * @param updaterID The ID of the member updating the role.
	 */
	public updateRoleColour = async (roleID: string, newColour: string, updaterID: string) =>
		await updateRoleColour(roleID, newColour, updaterID, this.bgCore);
}

export default RoleInventory;
