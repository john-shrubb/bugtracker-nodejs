import { gpPool } from '../../../dbConnection.js';
import generateID from '../../../helperFunctions/genID.js';
import BugtrackCore from '../../../index.js';
import PossibleEvents from '../../../types/enums/possibleEvents.js';

async function createRole(
	name: string,
	colour: string,
	displayTag: boolean,
	projectID: string,
	bgCore: BugtrackCore,
) {
	if (!bgCore.roleInventory.invReady) {
		throw new Error('The role inventory must be ready before creating a role.');
	}

	// Ensure the project actually exists
	const project = await bgCore.projectInventory.noCacheGetProjectByID(projectID);

	if (!project) {
		throw new Error('Attempting to create role under non existent project.', {
			cause: {
				projectID: projectID,
			},
		});
	}

	const roleID = generateID();
	// Insert the role into the database.
	await gpPool.query(
		'INSERT INTO roles (roleid, projectid, rolename, displaytag, permissionmask, colour) VALUES ($1, $2, $3, $4, $5, $6);',
		[roleID, projectID, name, displayTag, 0, colour],
	);

	// Notify of the new role.
	bgCore.cacheInvalidation.notifyUpdate(PossibleEvents.role, roleID);
}

export default createRole;
