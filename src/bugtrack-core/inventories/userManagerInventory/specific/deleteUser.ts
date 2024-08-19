import { umPool } from '../../../dbConnection.js';
import BugtrackCore from '../../../index.js';
import { possibleEvents } from '../../../services/cacheInvalidationService.js';
import User from '../../../types/user.js';

async function deleteUser(user: User, bgCore: BugtrackCore) {
	// Check that user exists so it's impossible to delete a non existent user.
	if (!(await bgCore.userInventory.noCacheGetUserByID(user.id))) {
		throw new Error('Attempted to delete non existent user.', {
			cause: user,
		});
	}

	// Query DB to delete user.
	await umPool.query('UPDATE users SET deleted=$1 WHERE userid=$2;', [true, user.id]);

	// Notify cache invalidation of the user deletion.
	bgCore.cacheInvalidation.notifyUpdate(possibleEvents.user, user.id);
}

export default deleteUser;
