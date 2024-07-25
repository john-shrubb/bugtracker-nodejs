import { QueryResult } from 'pg';
import { gpPool } from '../dbConnection.js';
import BugtrackCore from '../index.js';
import { InventoryType } from '../services/inventoryReadyService.js';
import PossibleEvents from '../types/enums/possibleEvents.js';
import PermissionIntMasks from '../types/permissionIntMasks.js';
import Role from '../types/role.js';
import ProjectMember from '../types/projectMember.js';

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
		this.initialiseRoleAssignmentCache.bind(this);
		this.bgCore.invReady.eventEmitter.on(
			'roleInventoryReady',
			() => this.initialiseRoleAssignmentCache()
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
	 * Initialise the role assignment cache.
	 */
	private async initialiseRoleAssignmentCache() {
		const roleAssignments : QueryResult<{ memberid: string, roleid: string }> =
			await gpPool.query(
				'SELECT memberid, roleid FROM roleassignments WHERE removed = $1;',
				[false]
			);
		
		// Iterate through all role assignments and add them to the cache.
		for (const assignment of roleAssignments.rows) {
			await this.roleAssignmentUpdateCallback(assignment.roleid, assignment.memberid);
		}

		// Notify that the role assignment cache is ready.
		this.bgCore.invReady.inventoryReady(InventoryType.roleAssignmentInventory);
	}

	/**
	 * Callback for a role assignment update.
	 */
	private async roleAssignmentUpdateCallback(roleID: string, memberID: string) {
		// Get the role object.
		const role = await this.bgCore.roleInventory.getRoleByID(roleID);

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
	 * Get all role assignments by a project.
	 * @param projectID The ID of the projects to get role assignments for.
	 * @returns An array of role assignments for the project. See the return format.
	 */
	public getRoleAssignmentsByProjectID(
		projectID: string
	) : Array<{ member: ProjectMember, role: Role }> {
		const relevantRoleAssignments =
			Array.from(this.roleAssignmentMap.entries())
			.filter(entry => {
				const member = this.bgCore.projectMemberInventory.getMemberByID(entry[0]);
				return member && member.project.id === projectID;
			});
		
			
		return relevantRoleAssignments.map(entry => {
			const member = this.bgCore.projectMemberInventory.getMemberByID(entry[0])!;
			return {
				member: member,
				role: entry[1],
			};
		});
	}

	/**
	 * Get a project members role
	 * @param memberID The ID of the member to get the role for.
	 * @returns The appropriate role for the member, or null if they don't have a role.
	 */
	public getRoleByMemberID(memberID: string) : Role | null {
		return this.roleAssignmentMap.get(memberID) || null;
	}

	/**
	 * 
	 * @param memberID The ID of the member to get the role for.
	 * @returns The role assigned to the member, or null if they don't have a role.
	 */
	public async noCacheGetRoleByMemberID(memberID: string) : Promise<Role | null> {
		const assignmentData : QueryResult<{ memberid: string, roleid: string }> =
			await gpPool.query(
				'SELECT roleid, memberid FROM roleassignments WHERE memberid = $1 AND removed = $2;',
				[memberID],
			);
		
		if (assignmentData.rows.length === 0) {
			return null;
		}

		const assignment = assignmentData.rows[0];

		const role = await this.bgCore.roleInventory.noCacheGetRoleByID(assignment.roleid);

		return role;
	}

	/**
	 * Assign a role to a project member.
	 * @param roleID The ID of the role to assign.
	 * @param memberID The ID of the member to assign the role to.
	 * @param assignedByMemberID The ID of the member who is assigning the role. Their
	 *                           permissions will be checked.
	 */
	public async assignRole(
		roleID: string,
		memberID: string,
		assignedByMemberID: string
	) {
		if (
			!this.bgCore.roleInventory.invReady ||
			!this.bgCore.invReady.isInventoryReady(InventoryType.projectMemberInventory)
		) {
			throw new Error('The role inventory and project member inventory must be ready before assigning roles.');
		}

		// Attempt to get role to ensure it exists.
		const role = this.bgCore.roleInventory.getRoleByID(roleID);

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
		if (
			!this.bgCore.roleInventory.memberHasPermission(
				assignedByMemberID,
				PermissionIntMasks.GRANT_ROLES_TO_USER,
			)
		) {
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
		if (
			!this.bgCore.roleInventory.memberHasPermission(
				unassignerID,
				PermissionIntMasks.GRANT_ROLES_TO_USER
			)
		) {
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

export default RoleAssignmentInventory;