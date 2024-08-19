import { QueryResult } from 'pg';
import { gpPool } from '../../../dbConnection.js';
import Role from '../../../types/role.js';
import BugtrackCore from '../../../index.js';

interface RoleDataStructure {
	roleid: string;
	projectid: string;
	rolename: string;
	displaytag: boolean;
	permissionmask: number;
	deleted: boolean;
	colour: string;
}

async function noCacheGetRoleByID(roleID: string, bgCore: BugtrackCore): Promise<Role | null> {
	const roleDataRaw: QueryResult<RoleDataStructure> = await gpPool.query(
		'SELECT * FROM roles WHERE roleid = $1 AND removed = $2;',
		[roleID, false],
	);

	if (!roleDataRaw.rows.length) return null;

	const roleData = roleDataRaw.rows[0];

	const role = new Role(
		bgCore,
		roleData.roleid,
		roleData.rolename,
		roleData.permissionmask,
		roleData.colour,
		roleData.displaytag,
		(await bgCore.projectInventory.noCacheGetProjectByID(roleData.projectid))!,
	);

	return role;
}

export default noCacheGetRoleByID;
