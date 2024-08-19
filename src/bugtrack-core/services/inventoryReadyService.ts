import EventEmitter from 'events';

enum InventoryType {
	userInventory,
	userManagerInventory,
	projectInventory,
	projectMemberInventory,
	roleAssignmentInventory,
	roleInventory,
	ticketInventory,
	commentInventory,
	tagInventory,
}

interface eventMap {
	userInventoryReady: [];
	userManagerInventoryReady: [];
	projectInventoryReady: [];
	projectMemberInventoryReady: [];
	roleAssignmentInventoryReady: [];
	roleInventoryReady: [];
	ticketInventoryReady: [];
	commentInventoryReady: [];
	tagInventoryReady: [];
	allInventoriesReady: [];
}

/**
 * This class is used to provide a way for other inventories to know when an inventory
 * they are relying on has fully updated.
 */

class InventoryReadyService {
	constructor() {
		this.eventEmitter = new EventEmitter();
	}
	/**
	 * The map of all inventories and their readiness.
	 */
	private inventoryReadyMap: Map<InventoryType, boolean> = new Map();

	/**
	 * The event emitter used to send out events for when each inventory declares itself
	 * as ready.
	 */
	public eventEmitter: EventEmitter<eventMap>;

	/**
	 * The method used by inventories to check if another inventory is ready.
	 */
	public isInventoryReady(inventoryType: InventoryType): boolean {
		return this.inventoryReadyMap.get(inventoryType) || false;
	}

	/**
	 * The method used by an inventory to notify the service that it is ready.
	 */
	public inventoryReady(inventoryType: InventoryType) {
		// Set the inventory status to ready in the map.
		this.inventoryReadyMap.set(inventoryType, true);

		// A switch for each type of inventory. If the inventory in question is ready,
		// emit the corresponding event.
		switch (inventoryType) {
			case InventoryType.userInventory:
				this.eventEmitter.emit('userInventoryReady');
				break;
			case InventoryType.userManagerInventory:
				this.eventEmitter.emit('userManagerInventoryReady');
				break;
			case InventoryType.projectInventory:
				this.eventEmitter.emit('projectInventoryReady');
				break;
			case InventoryType.projectMemberInventory:
				this.eventEmitter.emit('projectMemberInventoryReady');
				break;
			case InventoryType.roleInventory:
				this.eventEmitter.emit('roleInventoryReady');
				break;
			case InventoryType.ticketInventory:
				this.eventEmitter.emit('ticketInventoryReady');
				break;
			case InventoryType.commentInventory:
				this.eventEmitter.emit('commentInventoryReady');
				break;
			case InventoryType.tagInventory:
				this.eventEmitter.emit('tagInventoryReady');
				break;
		}

		const inventoryAmount = Object.keys(InventoryType).length / 2;
		if (inventoryAmount === this.inventoryReadyMap.size) {
			this.eventEmitter.emit('allInventoriesReady');
		}
	}

	/**
	 * Mass check a bunch of inventories to see if they are ready. Simply a helpful
	 * utility function to mass check 2 or more inventories to avoid spaghetti code.
	 * @param inventories An array of each type of inventory type you want to check.
	 * @param callback A callback function which will be called if passed and the
	 *                 inventories are ready.
	 * @returns True if all the inventories are marked as ready. False if not.
	 */
	public areInventoriesReady(inventories: InventoryType[], callback?: () => void): boolean {
		let inventoriesReady = true;
		for (const invType of inventories) {
			if (!this.isInventoryReady(invType)) {
				inventoriesReady = false;
				break;
			}
		}

		if (inventoriesReady && callback) {
			callback();
		}

		return inventoriesReady;
	}
}

export { InventoryReadyService, InventoryType };
