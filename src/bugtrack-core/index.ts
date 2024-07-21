import { CacheInvalidationService } from './services/cacheInvalidationService.js';
import UserInventory from './inventories/userInventory.js';
import UserManagerInventory from './inventories/userManagerInventory.js';
import ProjectInventory from './inventories/projectInventory.js';
import ProjectMemberInventory from './inventories/projectMemberInventory.js';
import { InventoryReadyService } from './services/inventoryReadyService.js';
import TicketInventory from './inventories/ticketInventory.js';
import RoleInventory from './inventories/roleInventory.js';

/**
 * The core of the bug tracker exposes all required services which other parts of the
 * overall app can interact with such as the web API.
 */

class BugtrackCore {
	/**
	 * Public instance of the cache invalidation service.
	 */
	public cacheInvalidation = new CacheInvalidationService();

	/**
	 * Public instance of the inventory ready service
	 */
	public invReady = new InventoryReadyService();

	/*
		Instances of each inventory:
	*/

	// User inventory
	public userInventory = new UserInventory(this);
	
	// User manager inventory
	public userManagerInventory = new UserManagerInventory(this);

	// Project inventory
	public projectInventory = new ProjectInventory(this);

	// Project member inventory
	public projectMemberInventory = new ProjectMemberInventory(this);

	// Ticket inventory
	public ticketInventory = new TicketInventory(this);

	// Role inventory
	public roleInventory = new RoleInventory(this);
}

export default BugtrackCore;