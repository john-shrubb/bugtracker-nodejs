import { gpPool } from '../../../dbConnection.js';
import BugtrackCore from '../../../index.js';
import PossibleEvents from '../../../types/enums/possibleEvents.js';
import PermissionIntMasks from '../../../types/permissionIntMasks.js';

async function unassignRole(memberID: string, unassignerID: string, bgCore: BugtrackCore) {
	// Get the member object to unassign the role from.
	const member = bgCore.projectMemberInventory.getMemberByID(memberID);

	// If the member doesn't exist, throw an error.
	if (!member) {
		throw new Error('Attempting to unassign role from non existent member.', {
			cause: {
				memberID: memberID,
			},
		});
	}

	// Get the unassigner object who is removing the role.
	const unassigner = bgCore.projectMemberInventory.getMemberByID(unassignerID);

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
		!bgCore.roleInventory.memberHasPermission(
			unassignerID,
			PermissionIntMasks.GRANT_ROLES_TO_USER,
		)
	) {
		throw new Error('Unassigner does not have permission to unassign roles.', {
			cause: {
				member: unassigner,
			},
		});
	}

	// Update the role assignment in the database to mark it as removed.
	await gpPool.query('UPDATE roleassignments SET removed = $1 WHERE memberid = $2;', [
		true,
		memberID,
	]);

	bgCore.cacheInvalidation.notifyUpdate(PossibleEvents.roleAssignment, memberID);
}

export default unassignRole;
