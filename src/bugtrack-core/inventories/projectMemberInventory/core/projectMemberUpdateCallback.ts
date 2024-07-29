import BugtrackCore from '../../../index.js';
import ProjectMember from '../../../types/projectMember.js';

async function projectMemberUpdateCallback(
	memberID : string,
	bgCore : BugtrackCore,
	projectMemberMap : Map<string, ProjectMember>,
) {
	const member = await bgCore.projectMemberInventory.noCacheGetMemberByID(memberID);
	
	if (!member) {
		projectMemberMap.delete(memberID);
		return;
	}

	projectMemberMap.set(memberID, member);
}

export default projectMemberUpdateCallback;