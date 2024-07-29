import { gpPool } from '../../../dbConnection.js';
import generateID from '../../../helperFunctions/genID.js';
import BugtrackCore from '../../../index.js';
import PossibleEvents from '../../../types/enums/possibleEvents.js';
import Project from '../../../types/project.js';
import User from '../../../types/user.js';

async function assignUser(
	user : User,
	project : Project,
	bgCore : BugtrackCore,
) {
	// Check if the user exists.
	if (!bgCore.userInventory.getUserByID(user.id)) {
		throw new Error('User does not exist.');
	}

	// Check if the project exists.
	if (!bgCore.projectInventory.getProjectByID(project.id)) {
		throw new Error('Project does not exist.');
	}
	
	// Check if the user is already a member of the project.
	if (
		bgCore.projectMemberInventory.getProjectMembersByUser(user)
			.some(member => member.project.id === project.id)
	) {
		throw new Error('User is already a member of the project.', {
			cause: {
				project: project,
				user: user,
			},
		});
	}

	// Generate a new ID for the project member.
	const memberID = generateID();

	// Add the project member to the database.
	await gpPool.query(
		'INSERT INTO projectmembers (memberid, userid, projectid) VALUES ($1, $2, $3);',
		[memberID, user.id, project.id],
	);

	// Notify of the new project member.
	bgCore.cacheInvalidation.notifyUpdate(
		PossibleEvents.projectmember, memberID
	);
}

export default assignUser;