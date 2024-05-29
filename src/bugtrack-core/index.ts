import { CacheInvalidationService } from './services/cacheInvalidationService.js';

class BugtrackCore {
	constructor() {
		this.cacheInvalidation = new CacheInvalidationService();
	}

	public cacheInvalidation;
}

export default BugtrackCore;