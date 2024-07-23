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
		this.roleAssignmentUpdateCallback.bind(this);

		// Callback for role object updates.
		this.bgCore.cacheInvalidation.eventEmitter.on('roleUpdate', (id : string) => this.roleUpdateCallback(id));
		this.bgCore.cacheInvalidation.eventEmitter.on('roleAssignmentUpdate',
			(roleID : string, memberID : string) =>
				this.roleAssignmentUpdateCallback(roleID, memberID)
		);
		// Initialise the cache.
		this.initialiseRoleCache();
	}

	/**
	 * The map of all the roles.
	 */
	private roleMap : Map<string, Role> = new Map();

	/**
	 * The map of all role assignments.
	 * string corresponds to a member ID.
	 */
	private roleAssignmentMap : Map<string, Role> = new Map();

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

		// Fetch all role assignments from DB.
		const roleAssignments : QueryResult<{ roleid: string, memberid: string }> =
			await gpPool.query('SELECT roleid, memberid FROM roleassignments WHERE removed = $1;', [false]);
		
		for (const roleAssignment of roleAssignments.rows) {
			await this.roleAssignmentUpdateCallback(roleAssignment.roleid, roleAssignment.memberid);
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
			// I will need to get every single member with the role and call the
			// roleAssignmentUpdateCallback for each of them.

			// Get all members with the role.
			const membersWithRole : QueryResult<{ memberid: string }> =
				await gpPool.query('SELECT memberid FROM roleassignments WHERE roleid = $1 AND removed = $2;', [roleID, false]);
			
			// For each member with the role, use the callback to wipe them from cache.
			for (const member of membersWithRole.rows) {
				await this.roleAssignmentUpdateCallback(roleID, member.memberid);
			}
			return;
		}

		this.roleMap.set(roleID, role);
	}

	/**
	 * Callback for a role assignment update.
	 */
	private async roleAssignmentUpdateCallback(roleID : string, memberID : string) {
		// Get the role object.
		const role = await this.noCacheGetRoleByID(roleID);

		// The member cannot have the role if it no longer exists.
		if (!role) {
			this.roleAssignmentMap.delete(memberID);
			// Set removed to true in the DB.
			await gpPool.query(
				'UPDATE roleassignments SET removed = $1 WHERE memberid = $2;',
				[true, memberID]
			);
			return;
		}

		// Get the member object to ensure that they exist.
		const member = await this.bgCore.projectMemberInventory.noCacheGetMemberByID(roleID);

		// If they don't exist, they clearly don't have the role anymore.
		if (!member) {
			this.roleAssignmentMap.delete(memberID);
			// Set removed to true in the DB.
			await gpPool.query(
				'UPDATE roleassignments SET removed = $1 WHERE memberid = $2;',
				[true, memberID]
			);
			return;
		}

		// Finally, assign the role to the assignment map if everything checks out.
		this.roleAssignmentMap.set(memberID, role);
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

		const role = this.roleAssignmentMap.get(memberID);

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
	 * Assign a role to a project member.
	 * @param roleID The ID of the role to assign.
	 * @param memberID The ID of the member to assign the role to.
	 * @param assignedByMemberID The ID of the member who is assigning the role. Their
	 *                           permissions will be checked.
	 */
	public async assignRole(
		roleID : string,
		memberID : string,
		assignedByMemberID : string
	) {
		if (
			!this.invReady ||
			!this.bgCore.invReady.isInventoryReady(InventoryType.projectMemberInventory)
		) {
			throw new Error('The role inventory and project member inventory must be ready before assigning roles.');
		}

		// Attempt to get role to ensure it exists.
		const role = this.getRoleByID(roleID);

		// And throw an error if it doesn't
		if (!role) {
			throw new Error('Attempting to assign non existent role.', {
				cause: {
					roleID: roleID,
				},
			});
		}

		// Assign the member object. If the inventory is ready, use the cache to speed up
		// the process.
		const member = this.bgCore.projectMemberInventory.getMemberByID(memberID);

		// If the member doesn't exist, throw an error.
		if (!member) {
			throw new Error('Attempting to assign role to non existent member.', {
				cause: {
					memberID: memberID,
				},
			});
		}

		// Check that the member project matches up with the project the role is under.
		if (role.parentProject.id !== member.project.id) {
			throw new Error('Role and member projects must match.', {
				cause: {
					role: role,
					member: member,
				},
			});
		}

		// Assigned by user object.
		const assignedByMember =
			this.bgCore.projectMemberInventory.getMemberByID(assignedByMemberID);

		// If the assigned by user doesn't exist, throw an error.
		if (!assignedByMember) {
			throw new Error('Attempting to assign role by non existent user.', {
				cause: {
					userID: assignedByMemberID,
				},
			});
		}
		
		// If the assigning user isn't a member of the project, throw an error.
		if (assignedByMember.project.id !== role.parentProject.id) {
			throw new Error('Assigning user is not a member of the project.', {
				cause: {
					member: assignedByMember,
				},
			});
		}

		// If the assigning user doesn't have permission to assign roles, throw an error.
		if (!this.memberHasPermission(assignedByMemberID, PermissionIntMasks.GRANT_ROLES_TO_USER)) {
			throw new Error('Assigning user does not have permission to assign roles.', {
				cause: {
					member: assignedByMember,
				},
			});
		}

		// Add the role assignment into the database.
		await gpPool.query(
			'INSERT INTO roleassignments (roleid, memberid, assignedby, assignedon) VALUES ($1, $2, $3);',
			[roleID, memberID, assignedByMemberID],
		);

		// Notify of the role assignment.
		this.bgCore.cacheInvalidation.notifyUpdate(PossibleEvents.roleAssignment, roleID, memberID);
		this.bgCore.cacheInvalidation.notifyUpdate(PossibleEvents.projectmember, memberID);
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

	/**
	 * Remove a role from a project member.
	 * @param memberID The ID of the member having their role removed.
	 * @param unassignerID The ID of the member who is removing the role.
	 */
	public async unassignRole(memberID : string, unassignerID : string) {
		// Get the member object to unassign the role from.
		const member = this.bgCore.projectMemberInventory.getMemberByID(memberID);

		// If the member doesn't exist, throw an error.
		if (!member) {
			throw new Error('Attempting to unassign role from non existent member.', {
				cause: {
					memberID: memberID,
				},
			});
		}

		// Get the unassigner object who is removing the role.
		const unassigner = this.bgCore.projectMemberInventory.getMemberByID(unassignerID);

		// If the unassigner doesn't exist, throw an error.
		if (!unassigner) {
			throw new Error('Attempting to unassign role by non existent user.', {
				cause: {
					userID: unassignerID,
				},
			});
		}

		// Check that the member and unassigner belong to the same project.
		if (member.project.id !== unassigner.project.id) {
			throw new Error('Unassigner and member projects must match.', {
				cause: {
					member: member,
					unassigner: unassigner,
				},
			});
		}

		// Check if the unassigner has permission to unassign roles.
		if (!this.memberHasPermission(unassignerID, PermissionIntMasks.GRANT_ROLES_TO_USER)) {
			throw new Error('Unassigner does not have permission to unassign roles.', {
				cause: {
					member: unassigner,
				},
			});
		}

		// Update the role assignment in the database to mark it as removed.
		await gpPool.query(
			'UPDATE roleassignments SET removed = $1 WHERE memberid = $2;',
			[true, memberID]
		);

		this.bgCore.cacheInvalidation.notifyUpdate(PossibleEvents.roleAssignment, memberID);
	}
}

export default RoleInventory;