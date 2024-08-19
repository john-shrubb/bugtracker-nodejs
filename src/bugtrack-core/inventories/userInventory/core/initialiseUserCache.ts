import { QueryResult } from 'pg';
import { gpPool } from '../../../dbConnection.js';
import { InventoryType } from '../../../services/inventoryReadyService.js';
import BugtrackCore from '../../../index.js';

async function initialiseUserCache(
	bgCore : BugtrackCore,
) {
	// Get a list of IDs in the users table.
	const allUserData : QueryResult<{ userid: string }> = await gpPool.query('SELECT userid FROM usersgp;');

	for (const user of allUserData.rows) {
		await bgCore.userInventory.userUpdateCallback(user.userid);
	}

	bgCore.invReady.inventoryReady(InventoryType.userInventory);
}

export default initialiseUserCache;