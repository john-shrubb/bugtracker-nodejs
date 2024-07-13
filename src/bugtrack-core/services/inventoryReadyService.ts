import EventEmitter from 'events';

enum InventoryType {
	userInventory,
	userManagerInventory,
	projectInventory,
	projectMemberInventory,
	roleInventory,
	ticketInventory,
	commentInventory,
	tagInventory,
}

interface eventMap {
	userInventoryReady: [],
	userManagerInventoryReady: [],
	projectInventoryReady: [],
	projectMemberInventoryReady: [],
	roleInventoryReady: [],
	ticketInventoryReady: [],
	commentInventoryReady: [],
	tagInventoryReady: [],
	allInventoriesReady: [],
}

/**
 * This class is used to provide a way for other inventories to know when an inventory
 * they are relying on has fully updated.
 */

class InventoryReadyService {
	constructor() {
		this.eventEmitter = new EventEmitter();
		this.on = this.eventEmitter.on;
	}
	/**
	 * The map of all inventories and their readiness.
	 */
	private inventoryReadyMap : Map<InventoryType, boolean> = new Map();

	private eventEmitter : EventEmitter<eventMap>;
	public on;

	/**
	 * The method used by inventories to check if another inventory is ready.
	 */
	public isInventoryReady(inventoryType : InventoryType) : boolean {
		return this.inventoryReadyMap.get(inventoryType) || false;
	}

	/**
	 * The method used by an inventory to notify the service that it is ready.
	 */
	public inventoryReady(inventoryType : InventoryType) {
		this.inventoryReadyMap.set(inventoryType, true);
		switch(inventoryType) {
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
}

export { InventoryReadyService, InventoryType };