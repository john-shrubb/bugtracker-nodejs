import { CacheInvalidationService } from './services/cacheInvalidationService.js';
import { gpPool } from './dbConnection.js';

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
}

export default BugtrackCore;