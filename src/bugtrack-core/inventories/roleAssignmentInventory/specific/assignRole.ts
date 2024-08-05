import { gpPool } from '../../../dbConnection.js';
import BugtrackCore from '../../../index.js';
import { InventoryType } from '../../../services/inventoryReadyService.js';
import PossibleEvents from '../../../types/enums/possibleEvents.js';
import PermissionIntMasks from '../../../types/permissionIntMasks.js';

async function assignRole(
	roleID: string,
	memberID: string,
	assignedByMemberID: string,
	bgCore : BugtrackCore,
) {
	if (
		!bgCore.roleInventory.invReady ||
		!bgCore.invReady.isInventoryReady(InventoryType.projectMemberInventory)
	) {
		throw new Error('The role inventory and project member inventory must be ready before assigning roles.');
	}

	// Attempt to get role to ensure it exists.
	const role = bgCore.roleInventory.getRoleByID(roleID);

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
	const member = bgCore.projectMemberInventory.getMemberByID(memberID);

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
		bgCore.projectMemberInventory.getMemberByID(assignedByMemberID);

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
		!bgCore.roleInventory.memberHasPermission(
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
	bgCore.cacheInvalidation.notifyUpdate(PossibleEvents.roleAssignment, roleID, memberID);
	bgCore.cacheInvalidation.notifyUpdate(PossibleEvents.projectmember, memberID);
}

export default assignRole;