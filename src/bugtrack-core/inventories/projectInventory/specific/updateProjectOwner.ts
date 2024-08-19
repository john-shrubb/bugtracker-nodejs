import { gpPool } from '../../../dbConnection.js';
import BugtrackCore from '../../../index.js';
import PossibleEvents from '../../../types/enums/possibleEvents.js';
import User from '../../../types/user.js';

async function updateProjectOwner(projectID: string, newOwner: User, bgCore: BugtrackCore) {
	// Check if the project exists. Throw an error if not.
	if (!bgCore.projectInventory.getProjectByID(projectID)) {
		throw new Error('Cannot update author of non existent project.', {
			cause: projectID,
		});
	}

	// Check if the new owner exists. Throw an error if not.
	if (!bgCore.userInventory.getUserByID(newOwner.id)) {
		throw new Error('New owner of project does not exist.', {
			cause: newOwner.id,
		});
	}

	// Query the database to update the project owner.
	await gpPool.query('UPDATE projects SET ownerid = $1 WHERE projectid = $2;', [
		newOwner.id,
		projectID,
	]);

	// Notify the cache invalidation service of the update.
	bgCore.cacheInvalidation.notifyUpdate(PossibleEvents.project, projectID);

	return;
}

export default updateProjectOwner;
