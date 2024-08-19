import { gpPool } from '../../../dbConnection.js';
import BugtrackCore from '../../../index.js';
import PossibleEvents from '../../../types/enums/possibleEvents.js';
import ProjectMember from '../../../types/projectMember.js';

async function unassignUser(projectMember: ProjectMember, bgCore: BugtrackCore) {
	// Check if the project member exists.
	if (!bgCore.projectMemberInventory.getMemberByID(projectMember.id)) {
		throw new Error('Project member does not exist.', {
			cause: projectMember,
		});
	}

	// Remove the project member from the database.
	await gpPool.query('UPDATE projectmembers SET removed = $1 WHERE memberid = $2;', [
		true,
		projectMember.id,
	]);

	// Notify of the project member removal.
	bgCore.cacheInvalidation.notifyUpdate(PossibleEvents.projectmember, projectMember.id);

	return;
}

export default unassignUser;
