import { gpPool } from '../../../dbConnection.js';
import BugtrackCore from '../../../index.js';
import PossibleEvents from '../../../types/enums/possibleEvents.js';

async function updateProjectName(projectID: string, newName: string, bgCore: BugtrackCore) {
	// Check if the project exists. Throw an error if not.
	if (!bgCore.projectInventory.getProjectByID(projectID)) {
		throw new Error('Cannot update display name of non existent project.', {
			cause: projectID,
		});
	}

	// Length check the project name.
	if (newName.trim() === '') {
		throw new Error('Project name cannot be empty.', {
			cause: newName,
		});
	}

	// Query the database to update the project name.
	await gpPool.query('UPDATE projects SET displayname = $1 WHERE projectid = $2;', [
		newName,
		projectID,
	]);

	// Notify the cache invalidation service of the update.
	bgCore.cacheInvalidation.notifyUpdate(PossibleEvents.project, projectID);

	return;
}

export default updateProjectName;
