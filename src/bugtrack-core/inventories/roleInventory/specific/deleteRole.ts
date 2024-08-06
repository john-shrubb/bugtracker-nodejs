import { gpPool } from '../../../dbConnection.js';
import BugtrackCore from '../../../index.js';
import PossibleEvents from '../../../types/enums/possibleEvents.js';
import PermissionIntMasks from '../../../types/permissionIntMasks.js';

async function deleteRole(
	roleID : string,
	deleterID : string,
	bgCore : BugtrackCore,
) {
	// Get the role object to delete.
	const role = bgCore.roleInventory.getRoleByID(roleID);
	
	// If the role doesn't exist, throw an error.
	if (!role) {
		throw new Error('Attempting to delete non existent role.', {
			cause: {
				roleID: roleID,
			},
		});
	}

	// Get the ProjectMember object of the user deleting the role.
	const deleter = bgCore.projectMemberInventory.getMemberByID(deleterID);

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
	if (!bgCore.roleInventory.memberHasPermission(deleterID, PermissionIntMasks.ADMINISTRATOR)) {
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

	bgCore.cacheInvalidation.notifyUpdate(PossibleEvents.role, roleID);
	bgCore.cacheInvalidation.notifyUpdate(PossibleEvents.roleAssignment, roleID);
}

export default deleteRole;