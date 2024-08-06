import { gpPool } from '../../../dbConnection.js';
import BugtrackCore from '../../../index.js';
import PossibleEvents from '../../../types/enums/possibleEvents.js';
import PermissionIntMasks from '../../../types/permissionIntMasks.js';

async function updateRoleColour(
	roleID : string,
	newColour : string,
	updaterID : string,
	bgCore : BugtrackCore,
) {
	// Get the role object to update.
	const role = bgCore.roleInventory.getRoleByID(roleID);

	// If the role doesn't exist, throw an error.
	if (!role) {
		throw new Error('Attempting to update non existent role.', {
			cause: {
				roleID: roleID,
			},
		});
	}

	// Get the ProjectMember object of the user updating the role.
	const updater = bgCore.projectMemberInventory.getMemberByID(updaterID);

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
	if (!bgCore.roleInventory.memberHasPermission(updaterID, PermissionIntMasks.ADMINISTRATOR)) {
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

	bgCore.cacheInvalidation.notifyUpdate(PossibleEvents.role, roleID);
}

export default updateRoleColour;