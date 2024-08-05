import { QueryResult } from 'pg';
import { gpPool } from '../../../dbConnection.js';
import ProjectMember from '../../../types/projectMember.js';
import BugtrackCore from '../../../index.js';

interface ProjectMemberDataStructure {
	memberid: string;
	userid: string;
	projectid: string;
	joindate: Date;
}

async function noCacheGetMemberByID(
	memberID : string,
	bgCore : BugtrackCore,
) : Promise<ProjectMember | null> {
	// Query the database for the member data.
	const memberDataRaw : QueryResult<ProjectMemberDataStructure> =
		await gpPool.query('SELECT * FROM projectmembers WHERE memberid = $1 AND removed = $2;', [memberID, false]);
	
	// If the member doesn't exist, return null.
	if (!memberDataRaw.rows.length) {
		return null;
	}

	// Get the member data itself.
	const memberData : ProjectMemberDataStructure = memberDataRaw.rows[0];

	// Get the parent project object.
	const parentProject =
		await bgCore.projectInventory.noCacheGetProjectByID(memberData.projectid);
	
	// If the parent project doesn't exist, throw an error.
	if (!parentProject) {
		throw new Error('Parent project not found for project member.', {
			cause: {
				memberID: memberData.memberid,
				projectID: memberData.projectid,
			},
		});
	}

	// Create the ProjectMember object.
	const member = new ProjectMember(
		bgCore,
		memberData.memberid,
		(await bgCore.userInventory.noCacheGetUserByID(memberData.userid))!,
		parentProject,
		bgCore.roleInventory.getRoleByProjectMemberID(memberData.memberid),
		memberData.joindate,
	);

	return member;
}

export default noCacheGetMemberByID;