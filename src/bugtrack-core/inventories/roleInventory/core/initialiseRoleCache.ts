import { QueryResult } from 'pg';
import { gpPool } from '../../../dbConnection.js';
import BugtrackCore from '../../../index.js';
import { InventoryType } from '../../../services/inventoryReadyService.js';

async function initialiseRoleCache(
	bgCore : BugtrackCore,
) {
	// Fetch all roles from the database.
	const roleIDs : QueryResult<{ roleid: string }> = await gpPool.query('SELECT roleid FROM roles WHERE deleted = $1;', [false]);

	// For each id in the array.
	for (const role of roleIDs.rows) {
		await bgCore.roleInventory.roleUpdateCallback(role.roleid);
	}

	// Mark this inventory as ready for use.
	bgCore.invReady.inventoryReady(InventoryType.roleInventory);
}

export default initialiseRoleCache;