import { QueryResult } from 'pg';
import BugtrackCore from '../../../index.js';
import Project from '../../../types/project.js';
import { gpPool } from '../../../dbConnection.js';

interface ProjectDataStructure {
	projectid: string;
	displayname: string;
	ownerid: string;
	creationdate: Date;
}

async function noCacheGetProjectByID(
	projectID: string,
	bgCore: BugtrackCore,
): Promise<Project | null> {
	// Get the project data from the database.
	const projectData: QueryResult<ProjectDataStructure> = await gpPool.query(
		'SELECT projectid, displayname, ownerid, creationdate FROM projects WHERE projectid = $1;',
		[projectID],
	);

	// If the project doesn't exist then just return null.
	if (!projectData.rows.length) {
		return null;
	}

	// Get the object itself with the project data.
	const project = projectData.rows[0];

	// Create the project object.
	const projectObject = new Project(
		bgCore,
		project.projectid,
		project.displayname,
		bgCore.userInventory.getUserByID(project.ownerid) ||
			// Just incase the user is not in the cache
			(await bgCore.userManagerInventory.getUserStubByID(project.ownerid))!,
		[], // POPULATE THESE LATER
		bgCore.projectMemberInventory.getProjectMembersByProjectID(project.projectid),
		project.creationdate,
	);

	// Return the project object.
	return projectObject;
}

export default noCacheGetProjectByID;
