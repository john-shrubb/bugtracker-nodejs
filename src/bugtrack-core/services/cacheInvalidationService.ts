import { EventEmitter } from 'node:events';
import checkID from '../helperFunctions/checkID.js';
import PossibleEvents from '../types/enums/possibleEvents.js';

/**
 * An object defining the possible event names and their arguments that the invalidation
 * service might emit. I really wish I could add a "commentID" hint in to the argument.
 */

interface eventMap {
	commentUpdate: [string];
	projectUpdate: [string];
	projectMemberUpdate: [string];
	roleUpdate: [string];
	sessionUpdate: [string];
	tagUpdate: [string];
	ticketUpdate: [string];
	userUpdate: [string];
}

/**
 * The cache invalidation service sends out notifications for when there is a change to an
 * object which requires an inventory to update and refetch its cache. This applies to all
 * inventories and indicates changes to ALL data classes.
 * 
 * The possible events are:
 * - commentUpdate
 * - projectUpdate
 * - projectMemberUpdate
 * - roleUpdate
 * - sessionUpdate
 * - tagUpdate
 * - ticketUpdate
 * - userUpdate
 * 
 * When an inventory queries the database in a way that may edit an object, the inventory
 * should also notify other inventories through this system.
 */

class CacheInvalidationService {
	constructor() {
		// Create a new emitter and expose the on function.
		this.eventEmitter = new EventEmitter<eventMap>();
	}

	// The actual emitter class is private to prevent other classes from polluting it.
	public eventEmitter;

	// Functions to notify the invalidation service of changes to objects.

	/**
	 * Notify the invalidation service that there was an update to an object.
	 * @param updateType The type of update that occurred.
	 * @param affectedID The ID of the object that has been modified.
	 */
	public notifyUpdate(updateType : PossibleEvents, affectedID : string) {
		// Check the ID is of the correct format.
		if (!checkID(affectedID)) {
			throw Error('Invalid ID passed as affectedID');
		}

		// Emit the correct event name based on the type of update that ocurred using the
		// enumerator. To ensure the inventories pull a fresh and correct copy of the user
		// objects from the database, no data is passed about what it is that has changed
		// about the object.

		switch (updateType) {
			case PossibleEvents.comment:
				this.eventEmitter.emit('commentUpdate', affectedID);
				break;
			case PossibleEvents.project:
				this.eventEmitter.emit('projectUpdate', affectedID);
				break;
			case PossibleEvents.projectmember:
				this.eventEmitter.emit('projectMemberUpdate', affectedID);
				break;
			case PossibleEvents.role:
				this.eventEmitter.emit('roleUpdate', affectedID);
				break;
			case PossibleEvents.session:
				this.eventEmitter.emit('sessionUpdate', affectedID);
				break;
			case PossibleEvents.tag:
				this.eventEmitter.emit('tagUpdate', affectedID);
				break;
			case PossibleEvents.ticket:
				this.eventEmitter.emit('ticketUpdate', affectedID);
				break;
			case PossibleEvents.user:
				this.eventEmitter.emit('userUpdate', affectedID);
				break;
			default:
				// Who knows what happened if we are at this stage.
				throw new Error('Invalid update type notification thrown: ' + updateType);
		}
	}
}


export { PossibleEvents as possibleEvents, CacheInvalidationService };
