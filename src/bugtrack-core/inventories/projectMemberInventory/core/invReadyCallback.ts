import BugtrackCore from '../../../index.js';
import { InventoryType } from '../../../services/inventoryReadyService.js';

function invReadyCallback(bgCore: BugtrackCore, callback: () => void) {
	bgCore.invReady.areInventoriesReady(
		[InventoryType.userInventory, InventoryType.roleInventory],
		callback,
	);
}

export default invReadyCallback;
