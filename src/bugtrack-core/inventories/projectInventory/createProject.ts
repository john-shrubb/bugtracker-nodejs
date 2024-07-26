import { gpPool } from '../../dbConnection.js';
import generateID from '../../helperFunctions/genID.js';
import BugtrackCore from '../../index.js';
import PossibleEvents from '../../types/enums/possibleEvents.js';
import User from '../../types/user.js';

async function createProject(
	name : string,
	author : User,
	bgCore : BugtrackCore,
) : Promise<string> {
	// Validate the project name and author.
	if (name.trim() === '') {
		throw new Error('Project name cannot be empty.');
	}

	// Check whether the author actually exists.
	if (!bgCore.userInventory.getUserByID(author.id)) {
		throw new Error('Author does not exist.');
	}

	// Genereate a new ID for the project.
	const id = generateID();

	// Add the project to the database.
	await gpPool.query(
		'INSERT INTO projects (projectid, displayname, ownerid, creationdate) VALUES ($1, $2, $3, $4);',
		[id, name, author.id, new Date()]
	);

	// Notify the cache invalidation service of the update.
	bgCore.cacheInvalidation.notifyUpdate(PossibleEvents.project, id);

	return id;
}

export default createProject;