import { QueryResult } from 'pg';
import { umPool } from '../../../dbConnection.js';
import { InventoryType } from '../../../services/inventoryReadyService.js';
import BugtrackCore from '../../../index.js';

async function initialiseSessionCache(bgCore: BugtrackCore) {
	// Grab all session objects.
	const rawSessionQuery: QueryResult<{ sessionid: string }> = await umPool.query(
		'SELECT sessionid FROM sessions;',
	);

	// For each session that exists...

	rawSessionQuery.rows.forEach(async (session) => {
		await bgCore.userManagerInventory.sessionUpdateCallback(session.sessionid);
	});

	bgCore.invReady.inventoryReady(InventoryType.userManagerInventory);
}

export default initialiseSessionCache;
