import { QueryResult } from 'pg';
import { gpPool } from '../../../dbConnection.js';
import { InventoryType } from '../../../services/inventoryReadyService.js';
import BugtrackCore from '../../../index.js';

async function initialiseRoleAssignmentCache(
	bgCore : BugtrackCore
) {
	const roleAssignments : QueryResult<{ memberid: string, roleid: string }> =
		await gpPool.query(
			'SELECT memberid, roleid FROM roleassignments WHERE removed = $1;',
			[false]
		);
	
	// Iterate through all role assignments and add them to the cache.
	for (const assignment of roleAssignments.rows) {
		await bgCore.roleAssignmentInventory.roleAssignmentUpdateCallback(
			assignment.roleid,
			assignment.memberid
		);
	}

	// Notify that the role assignment cache is ready.
	bgCore.invReady.inventoryReady(InventoryType.roleAssignmentInventory);
}

export default initialiseRoleAssignmentCache;