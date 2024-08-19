import { QueryResult } from 'pg';
import { gpPool } from '../../../dbConnection.js';
import Role from '../../../types/role.js';
import BugtrackCore from '../../../index.js';

async function noCacheGetRoleByMemberID(
	memberID: string,
	bgCore: BugtrackCore,
): Promise<Role | null> {
	const assignmentData: QueryResult<{ memberid: string; roleid: string }> = await gpPool.query(
		'SELECT roleid, memberid FROM roleassignments WHERE memberid = $1 AND removed = $2;',
		[memberID],
	);

	if (assignmentData.rows.length === 0) {
		return null;
	}

	const assignment = assignmentData.rows[0];

	const role = await bgCore.roleInventory.noCacheGetRoleByID(assignment.roleid);

	return role;
}

export default noCacheGetRoleByMemberID;
