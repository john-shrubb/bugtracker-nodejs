import { QueryResult } from 'pg';
import { gpPool } from '../dbConnection.js';
import BugtrackCore from '../index.js';
import { InventoryType } from '../services/inventoryReadyService.js';
import Role from '../types/role.js';
import PermissionIntMasks from '../types/permissionIntMasks.js';
import generateID from '../helperFunctions/genID.js';
import PossibleEvents from '../types/enums/possibleEvents.js';

interface RoleDataStructure {
	roleid: string;
	projectid: string;
	rolename: string;
	displaytag: boolean;
	permissionmask: number;
	deleted: boolean;
	colour: string;
}

// TODO: Make a dedicated inventory for roleAssignments.

/**
 * Responsible for the implementations of roles in the system. Roles are used to represent
 * someone's status within a project and how many permissions they have.
 * 
 * This inventory is also responsible for (un)assigning roles to a project member.
 */
class RoleInventory {
	constructor(
		private bgCore : BugtrackCore,
	) {
		// Bind 'this' to callback function.
		this.roleUpdateCallback.bind(this);

		// Callback for role object updates.
		this.bgCore.cacheInvalidation.eventEmitter.on('roleUpdate', (id : string) => this.roleUpdateCallback(id));

		// Initialise the cache.
		this.initialiseRoleCache();
	}

	/**
	 * The map of all the roles.
	 */
	private roleMap : Map<string, Role> = new Map();

	get invReady() : boolean {
		return this.bgCore.invReady.isInventoryReady(InventoryType.roleInventory);
	}

	/**
	 * Initialise the cache of all roles in the database.
	 */
	public async initialiseRoleCache() {
		// Fetch all roles from the database.
		const roleIDs : QueryResult<{ roleid: string }> = await gpPool.query('SELECT roleid FROM roles WHERE deleted = $1;', [false]);

		// For each id in the array.
		for (const role of roleIDs.rows) {
			await this.roleUpdateCallback(role.roleid);
		}

		// Mark this inventory as ready for use.
		this.bgCore.invReady.inventoryReady(InventoryType.roleInventory);
	}

	/**
	 * Callback for a role update.
	 */
	private async roleUpdateCallback(roleID : string) {
		const role = await this.noCacheGetRoleByID(roleID);

		if (!role) {
			this.roleMap.delete(roleID);
			return;
		}

		this.roleMap.set(roleID, role);
	}

	/**
	 * Get a role by it's ID.
	 * @param roleID The ID of the role to get.
	 * @returns The role object, or null if it doesn't exist.
	 */
	public getRoleByID(roleID : string) : Role | null {
		return this.roleMap.get(roleID) || null;
	}

	/**
	 * No cache version of getRoleByID. Useful if you need a literally completely up to
	 * date role object, for example if you have just updated the role object and need to
	 * use that.
	 * @param roleID The ID of the role to get.
	 * @returns The role object, or null if it doesn't exist.
	 */
	public async noCacheGetRoleByID(roleID : string) : Promise<Role | null> {
		const roleDataRaw : QueryResult<RoleDataStructure> = await gpPool.query(
			'SELECT * FROM roles WHERE roleid = $1 AND removed = $2;',
			[roleID, false]
		);

		if (!roleDataRaw.rows.length) return null;

		const roleData = roleDataRaw.rows[0];

		const role = new Role(
			this.bgCore,
			roleData.roleid,
			roleData.rolename,
			roleData.permissionmask,
			roleData.colour,
			roleData.displaytag,
			(await this.bgCore.projectInventory.noCacheGetProjectByID(roleData.projectid))!,
		);

		return role;
	}

	/**
	 * Get all roles created under a project.
	 * @param projectID The ID of the project to find roles for.
	 * @returns An array of roles under the project. If there are no roles, then an empty
	 *          array is returned.
	 */
	public getRolesByProjectID(projectID : string) : Role[] {
		const rolesArray = Array.from(this.roleMap.values());

		const filteredRoles = rolesArray.filter(role => role.parentProject.id === projectID);

		return filteredRoles;
	}

	/**
	 * Get a member's role within a project.
	 * @param memberID The ID of the member to get the role for.
	 * @returns The role the member has, or null if they don't have one.
	 */
	public getRoleByProjectMemberID(memberID : string) : Role | null {
		if (!this.invReady) {
			throw new Error('The role inventory must be ready before getting a role by member ID.');
		}

		const role = this.bgCore.roleAssignmentInventory.getRoleByMemberID(memberID);

		if (!role) return null;

		return null;
	}

	/**
	 * Check if a member has permission to perform an action. You should pass the
	 * permissionInt argument using [PermissionIntMasks](../types/permissionIntMasks.ts).
	 * @param memberID The ID of the member to check permissions for.
	 * @param permissionInt The permission integer to check against.
	 * @returns True if the member has permission, false if they don't.
	 */
	public memberHasPermission(memberID : string, permissionInt : number) : boolean {
		if (!this.invReady) {
			throw new Error('The role inventory must be ready before checking permissions.');
		}

		const member = this.bgCore.projectMemberInventory.getMemberByID(memberID);

		if (!member) {
			throw new Error('Attempting to check permissions for non existent member.', {
				cause: {
					memberID: memberID,
				},
			});
		}

		if (!member.role) return false;

		if (member.role.permissionInt & permissionInt) return true;
		else return false;
	}

	/**
	 * Create a new role under a project.
	 * @param name The name of the role.
	 * @param colour The colour of the role.
	 * @param displayTag Whether the role should display a tag next to members with it.
	 * @param projectID The ID of the project to create the role under.
	 */
	public async createRole(
		name: string,
		colour: string,
		displayTag : boolean,
		projectID : string,
	) {
		if (!this.invReady) {
			throw new Error('The role inventory must be ready before creating a role.');
		}

		// Ensure the project actually exists
		const project = await this.bgCore.projectInventory.noCacheGetProjectByID(projectID);

		if (!project) {
			throw new Error('Attempting to create role under non existent project.', {
				cause: {
					projectID: projectID,
				},
			});
		}

		const roleID = generateID();
		// Insert the role into the database.
		await gpPool.query(
			'INSERT INTO roles (roleid, projectid, rolename, displaytag, permissionmask, colour) VALUES ($1, $2, $3, $4, $5, $6);',
			[roleID, projectID, name, displayTag, 0, colour],
		);

		// Notify of the new role.
		this.bgCore.cacheInvalidation.notifyUpdate(PossibleEvents.role, roleID);
	}

	public async deleteRole(roleID : string, deleterID : string) {
		// Get the role object to delete.
		const role = this.getRoleByID(roleID);
		
		// If the role doesn't exist, throw an error.
		if (!role) {
			throw new Error('Attempting to delete non existent role.', {
				cause: {
					roleID: roleID,
				},
			});
		}

		// Get the ProjectMember object of the user deleting the role.
		const deleter = this.bgCore.projectMemberInventory.getMemberByID(deleterID);

		if (!deleter) {
			throw new Error('Nonexistent member attempting to delete role.', {
				cause: {
					userID: deleterID,
				},
			});
		}

		// Check that the deleter and the role belong to the same project.
		if (role.parentProject.id !== deleter.project.id) {
			throw new Error('Role and deleter projects must match.', {
				cause: {
					role: role,
					deleter: deleter,
				},
			});
		}

		// Check if the deleter has permission to delete roles.
		if (!this.memberHasPermission(deleterID, PermissionIntMasks.ADMINISTRATOR)) {
			throw new Error('Deleter does not have permission to delete roles.', {
				cause: {
					member: deleter,
				},
			});
		}

		// Update the role in the database.
		await gpPool.query(
			'UPDATE roles SET deleted = $1 WHERE roleid = $2;',
			[true, roleID]
		);

		this.bgCore.cacheInvalidation.notifyUpdate(PossibleEvents.role, roleID);
		this.bgCore.cacheInvalidation.notifyUpdate(PossibleEvents.roleAssignment, roleID);
	}

	/**
	 * Update a role's permission. This can be used to add or remove permissions from a
	 * role.
	 * @param roleID The ID of the role to update.
	 * @param permissionMask The integer mask of the permission to update.
	 * @param updaterID The ID of the member updating the role.
	 * @param addingPermission Whether the permission is being added to the role or
	 *                         removed. Defaults to true.
	 */
	public async updateRolePermission(
		roleID : string,
		permissionMask : number,
		updaterID : string,
		addingPermission = true,
	) {
		// Get the role object to update.
		const role = this.getRoleByID(roleID);

		if (!role) {
			throw new Error('Attempting to update non existent role.', {
				cause: {
					roleID: roleID,
				},
			});
		}

		// Get the ProjectMember object of the user updating the role.
		const updater = this.bgCore.projectMemberInventory.getMemberByID(updaterID);

		if (!updater) {
			throw new Error('Nonexistent member attempting to update role.', {
				cause: {
					userID: updaterID,
				},
			});
		}

		// Check that the updater and the role belong to the same project.
		if (role.parentProject.id !== updater.project.id) {
			throw new Error('Role and updater projects must match.', {
				cause: {
					role: role,
					updater: updater,
				},
			});
		}

		// Check if the updater has permission to update roles.
		// (Admin permission
		if (!this.memberHasPermission(updaterID, PermissionIntMasks.ADMINISTRATOR)) {
			throw new Error('Updater does not have permission to update roles.', {
				cause: {
					member: updater,
				},
			});
		}

		let newPermissionMask;
		// Calculate the new permission mask.
		if (addingPermission) {
			newPermissionMask = role.permissionInt | permissionMask;
		} else {
			newPermissionMask = role.permissionInt & ~permissionMask;
		}

		// Update the role in the database.
		await gpPool.query(
			'UPDATE roles SET permissionmask = $1 WHERE roleid = $2;',
			[newPermissionMask, roleID]
		);

		// Notify of the role update.
		this.bgCore.cacheInvalidation.notifyUpdate(PossibleEvents.role, roleID);
	}

	/**
	 * Update the name of a role.
	 * @param roleID The ID of the role to update.
	 * @param newName The new name of the role.
	 * @param updaterID The ID of the member updating the role.
	 */
	public async updateRoleName(roleID : string, newName : string, updaterID : string) {
		// Get the role object to update.
		const role = this.getRoleByID(roleID);

		if (!role) {
			throw new Error('Attempting to update non existent role.', {
				cause: {
					roleID: roleID,
				},
			});
		}

		// Get the ProjectMember object of the user updating the role.
		const updater = this.bgCore.projectMemberInventory.getMemberByID(updaterID);

		if (!updater) {
			throw new Error('Nonexistent member attempting to update role.', {
				cause: {
					userID: updaterID,
				},
			});
		}

		// Check that the updater and the role belong to the same project.
		if (role.parentProject.id !== updater.project.id) {
			throw new Error('Role and updater projects must match.', {
				cause: {
					role: role,
					updater: updater,
				},
			});
		}

		// Check if the updater has permission to update roles.
		// (Admin permission)
		if (!this.memberHasPermission(updaterID, PermissionIntMasks.ADMINISTRATOR)) {
			throw new Error('Updater does not have permission to update roles.', {
				cause: {
					member: updater,
				},
			});
		}

		newName = newName.trim();

		if (newName.length < 3 || newName.length > 50) {
			throw new Error('Role name must be between 3 and 50 characters.', {
				cause: {
					newName: newName,
				},
			});
		}
		// Update the role in the database.
		await gpPool.query(
			'UPDATE roles SET rolename = $1 WHERE roleid = $2;',
			[newName, roleID]
		);

		this.bgCore.cacheInvalidation.notifyUpdate(PossibleEvents.role, roleID);
	}

	/**
	 * Update the colour of a role.
	 * @param roleID The ID of the role to update.
	 * @param newColour The new colour of the role.
	 * @param updaterID The ID of the member updating the role.
	 */
	public async updateRoleColour(roleID : string, newColour : string, updaterID : string) {
		// Get the role object to update.
		const role = this.getRoleByID(roleID);

		// If the role doesn't exist, throw an error.
		if (!role) {
			throw new Error('Attempting to update non existent role.', {
				cause: {
					roleID: roleID,
				},
			});
		}

		// Get the ProjectMember object of the user updating the role.
		const updater = this.bgCore.projectMemberInventory.getMemberByID(updaterID);

		if (!updater) {
			throw new Error('Nonexistent member attempting to update role.', {
				cause: {
					userID: updaterID,
				},
			});
		}

		// Check that the updater and the role belong to the same project.
		if (role.parentProject.id !== updater.project.id) {
			throw new Error('Role and updater projects must match.', {
				cause: {
					role: role,
					updater: updater,
				},
			});
		}

		// Check if the updater has permission to update roles.
		// (Admin permission)
		if (!this.memberHasPermission(updaterID, PermissionIntMasks.ADMINISTRATOR)) {
			throw new Error('Updater does not have permission to update roles.', {
				cause: {
					member: updater,
				},
			});
		}

		newColour = newColour.trim().toUpperCase();

		if (!newColour.match(/^[0-9A-F]{6}$/)) {
			throw new Error('Role colour must be a valid 6 digit hex colour code.', {
				cause: {
					newColour: newColour,
				},
			});
		}

		// Update the role in the database.
		await gpPool.query(
			'UPDATE roles SET colour = $1 WHERE roleid = $2;',
			[newColour, roleID]
		);

		this.bgCore.cacheInvalidation.notifyUpdate(PossibleEvents.role, roleID);
	}
}

export default RoleInventory;