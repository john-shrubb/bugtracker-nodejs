import { QueryResult } from 'pg';
import { gpPool } from '../../../dbConnection.js';
import BugtrackCore from '../../../index.js';
import { InventoryType } from '../../../services/inventoryReadyService.js';

async function initialiseProjectMemberCache(bgCore: BugtrackCore) {
	const projectMembersRaw: QueryResult<{ memberid: string }> = await gpPool.query(
		'SELECT memberid FROM projectmembers WHERE removed = $1;',
		[false],
	);

	const projectMembers = projectMembersRaw.rows;

	for (const memberData of projectMembers) {
		await bgCore.projectMemberInventory.projectMemberUpdateCallback(memberData.memberid);
	}

	bgCore.invReady.inventoryReady(InventoryType.projectMemberInventory);
}

export default initialiseProjectMemberCache;
