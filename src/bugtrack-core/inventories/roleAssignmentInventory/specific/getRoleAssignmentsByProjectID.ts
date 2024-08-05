import BugtrackCore from '../../../index.js';
import ProjectMember from '../../../types/projectMember.js';
import Role from '../../../types/role.js';

function getRoleAssignmentsByProjectID(
	projectID: string,
	bgCore : BugtrackCore,
	roleAssignmentMap: Map<string, Role>,
) : Array<{ member: ProjectMember, role: Role }> {
	const relevantRoleAssignments =
		Array.from(roleAssignmentMap.entries())
		.filter(entry => {
			const member = bgCore.projectMemberInventory.getMemberByID(entry[0]);
			return member && member.project.id === projectID;
		});
	
		
	return relevantRoleAssignments.map(entry => {
		const member = bgCore.projectMemberInventory.getMemberByID(entry[0])!;
		return {
			member: member,
			role: entry[1],
		};
	});
}

export default getRoleAssignmentsByProjectID;