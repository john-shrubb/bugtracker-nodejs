import BugtrackCore from '../../../index.js';
import ProjectMember from '../../../types/projectMember.js';

function getProjectMembersByProjectID(
	projectID: string,
	bgCore: BugtrackCore,
	memberMap: Map<string, ProjectMember>,
): ProjectMember[] {
	// Check the project exists. Throw an error if it doesn't.
	if (!bgCore.projectInventory.getProjectByID(projectID)) {
		throw new Error('Project does not exist.', {
			cause: projectID,
		});
	}

	// Convert the map to an array of project members.
	const projectMembers = Array.from(memberMap.values());

	// Return a filtered array of the project members in the project.
	return projectMembers.filter((member) => member.project.id === projectID);
}

export default getProjectMembersByProjectID;
