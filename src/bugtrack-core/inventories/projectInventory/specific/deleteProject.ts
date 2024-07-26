import { gpPool } from '../../../dbConnection.js';
import BugtrackCore from '../../../index.js';
import PossibleEvents from '../../../types/enums/possibleEvents.js';

async function deleteProject(
	projectID : string,
	bgCore : BugtrackCore,
) {
	// Check if project exists. Throw an error if not.
	if (!bgCore.projectInventory.getProjectByID(projectID)) {
		throw new Error('Cannot delete non existent project.', {
			cause: projectID,
		});
	}

	// Delete the project from the database.
	await gpPool.query('DELETE FROM projects WHERE projectid = $1;', [projectID]);

	// Notify the cache invalidation service of the update.
	bgCore.cacheInvalidation.notifyUpdate(PossibleEvents.project, projectID);

	return;
}

export default deleteProject;