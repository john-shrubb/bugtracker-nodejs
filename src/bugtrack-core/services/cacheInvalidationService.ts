import { EventEmitter } from 'node:events';
import checkID from '../helperFunctions/checkID.js';

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
 * An enumeration
 */

enum possibleEvents {
	comment = 'COMMENTUPDATEEVENT',
	project = 'PROJECTUPDATEEVENT',
	projectmember = 'PROJECTMEMBERUPDATEEVENT',
	role = 'ROLEUPDATEEVENT',
	session = 'SESSIONUPDATEEVENT',
	tag = 'TAGUPDATEEVENT',
	ticket = 'TICKETUPDATEEVENT',
	user = 'USERUPDATEEVENT',
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
		this.emitter = new EventEmitter<eventMap>();
		this.on = this.emitter.on;
	}

	// The actual emitter class is private to prevent other classes from polluting it.
	private emitter;

	// On is exposed as emitter.on to allow other users to still listen to the class.
	public on;

	// Functions to notify the invalidation service of changes to objects.

	/**
	 * Notify the invalidation service that there was an update to an object.
	 * @param updateType The type of update that occurred.
	 * @param affectedID The ID of the object that has been modified.
	 */
	public notifyUpdate(updateType : possibleEvents, affectedID : string) {
		// Check the ID is of the correct format.
		if (!checkID(affectedID)) {
			throw Error('Invalid ID passed as affectedID');
		}

		// Emit the correct event name based on the type of update that ocurred using the
		// enumerator. To ensure the inventories pull a fresh and correct copy of the user
		// objects from the database, no data is passed about what it is that has changed
		// about the object.

		switch (updateType) {
			case possibleEvents.comment:
				this.emitter.emit('commentUpdate', affectedID);
				break;
			case possibleEvents.project:
				this.emitter.emit('projectUpdate', affectedID);
				break;
			case possibleEvents.projectmember:
				this.emitter.emit('projectMemberUpdate', affectedID);
				break;
			case possibleEvents.role:
				this.emitter.emit('roleUpdate', affectedID);
				break;
			case possibleEvents.session:
				this.emitter.emit('sessionUpdate', affectedID);
				break;
			case possibleEvents.tag:
				this.emitter.emit('tagUpdate', affectedID);
				break;
			case possibleEvents.ticket:
				this.emitter.emit('ticketUpdate', affectedID);
				break;
			case possibleEvents.user:
				this.emitter.emit('userUpdate', affectedID);
				break;
			default:
				// Who knows what happened if we are at this stage.
				throw new Error('Invalid update type notification thrown: ' + updateType);
		}
	}
}


export { possibleEvents, CacheInvalidationService };
