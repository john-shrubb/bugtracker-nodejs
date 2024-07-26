import BugtrackCore from '../../../index.js';
import Project from '../../../types/project.js';

async function projectUpdateCallback(
	projectID : string,
	bgCore : BugtrackCore,
	projectMap : Map<string, Project>,
) {
	// Get the project object directly from the database.
	const project : Project | null = await bgCore.projectInventory.noCacheGetProjectByID(projectID);

	// If it doesn't exist in the database anymore then delete it from cache as it
	// doesn't exist anymore.
	if (!project) {
		projectMap.delete(projectID);
		return;
	}

	// Add the project to the cache.
	projectMap.set(projectID, project);
}

export default projectUpdateCallback;