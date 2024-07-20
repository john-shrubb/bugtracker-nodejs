import { QueryResult } from 'pg';
import { gpPool } from '../dbConnection.js';
import BugtrackCore from '../index.js';
import { InventoryType } from '../services/inventoryReadyService.js';
import Role from '../types/role.js';
import PermissionIntMasks from '../types/permissionIntMasks.js';

interface RoleDataStructure {
	roleid: string;
	projectid: string;
	rolename: string;
	displaytag: boolean;
	permissionmask: number;
	deleted: boolean;
	colour: string;
}

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
	 * The map of all the roles. Role assignments must be fetched directly from DB.
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
		const rolesData : QueryResult<RoleDataStructure> = await gpPool.query('SELECT * FROM roles;');

		// Array using the RoleDataStructure interface.
		const roleData : RoleDataStructure[] = rolesData.rows;

		// For each role in the array.
		for (const role of roleData) {
			// Make a new role object
			const newRole = new Role(
				this.bgCore,
				role.roleid,
				role.rolename,
				role.permissionmask,
				role.colour,
				role.displaytag,
				(await this.bgCore.projectInventory.noCacheGetProjectByID(role.projectid))!,
			);

			// And add it to the cache.
			this.roleMap.set(role.roleid, newRole);
		}

		// Mark this inventory as ready for use.
		this.bgCore.invReady.inventoryReady(InventoryType.roleInventory);
	}

	/**
	 * Callback for a role update.
	 */
	private async roleUpdateCallback(roleID : string) {
		const roleDataRaw : QueryResult<RoleDataStructure> = await gpPool.query('SELECT * FROM roles WHERE roleid = $1;', [roleID]);
		const roleData = roleDataRaw.rows[0];

		// If the role is marked as deleted, remove it from the cache.
		if (roleData.deleted) {
			this.roleMap.delete(roleID);
			return;
		}

		// Create a new role object and add it to the cache.
		const newRole = new Role(
			this.bgCore,
			roleData.roleid,
			roleData.rolename,
			roleData.permissionmask,
			roleData.colour,
			roleData.displaytag,
			(await this.bgCore.projectInventory.noCacheGetProjectByID(roleData.projectid))!,
		);

		this.roleMap.set(roleID, newRole);
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
		const roleDataRaw : QueryResult<RoleDataStructure> = await gpPool.query('SELECT * FROM roles WHERE roleid = $1;', [roleID]);

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
	public async getRolesByProjectID(projectID : string) : Promise<Role[]> {
		const rolesArray = Array.from(this.roleMap.values());

		const filteredRoles = rolesArray.filter(role => role.parentProject.id === projectID);

		return filteredRoles;
	}

	public async getRoleByProjectMemberID(memberID : string) : Promise<Role | null> {
		// Select the ID of the role
		const memberDataRaw : QueryResult<{ roleid : string }> = await gpPool.query(
			'SELECT roleid FROM roleassignments WHERE memberid = $1 AND removed = $2;',
			[memberID, false]
		);

		// If the member doesn't have a role, return null.
		if (!memberDataRaw.rows.length) return null;

		let role : Role;

		// Get the role by it's ID from cache.
		if (this.bgCore.invReady.isInventoryReady(InventoryType.roleInventory)) {
			role = this.getRoleByID(memberDataRaw.rows[0].roleid)!;
		} else {
			role = (await this.noCacheGetRoleByID(memberDataRaw.rows[0].roleid))!;
		}

		return role;
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
	 * Assign a role to a project member.
	 * @param roleID The ID of the role to assign.
	 * @param memberID The ID of the member to assign the role to.
	 * @param assignedByMemberID The ID of the member who is assigning the role. Their
	 *                           permissions will be checked.
	 */
	public async assignRoleToProjectMember(
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
			[roleID, memberID, assignedByMemberID]
		);
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
	}
}

export default RoleInventory;