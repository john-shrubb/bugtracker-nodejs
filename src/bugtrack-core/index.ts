import { CacheInvalidationService } from './services/cacheInvalidationService.js';
import { gpPool } from './dbConnection.js';
import UserInventory from './inventories/userInventory.js';
import UserManagerInventory from './inventories/userManagerInventory.js';

/**
 * The core of the bug tracker exposes all required services which other parts of the
 * overall app can interact with such as the web API.
 */

class BugtrackCore {
	constructor() {
		this.cacheInvalidation = new CacheInvalidationService();
	}

	/**
	 * Private instance of the database.
	 */
	private gpPool = gpPool;

	/**
	 * Public instance of the cache invalidation service.
	 */
	public cacheInvalidation;

	/*
		Instances of each inventory:
	*/

	// User inventory
	public userInventory = new UserInventory(this, this.gpPool);
	
	// User manager inventory
	public userManagerInventory = new UserManagerInventory(this);
}

export default BugtrackCore;