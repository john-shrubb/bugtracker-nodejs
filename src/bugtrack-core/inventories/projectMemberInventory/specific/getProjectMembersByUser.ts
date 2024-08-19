import BugtrackCore from '../../../index.js';
import ProjectMember from '../../../types/projectMember.js';
import User from '../../../types/user.js';

function getProjectMembersByUser(
	user: User,
	bgCore: BugtrackCore,
	projectMemberMap: Map<string, ProjectMember>,
): ProjectMember[] {
	// Check the user actually exists. If they don't, throw an error.
	if (!bgCore.userInventory.getUserByID(user.id)) {
		throw new Error('User does not exist', {
			cause: user,
		});
	}

	// Convert the map to an array of project members.
	const projectMembers = Array.from(projectMemberMap.values());

	return projectMembers.filter(
		// If the project member ID matches.
		(member) =>
			member.user.id === user.id ||
			// If the author of the project is the user
			member.project.owner.id === user.id,
	);
}

export default getProjectMembersByUser;
