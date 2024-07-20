import { QueryResult } from 'pg';
import BugtrackCore from '../index.js';
import TicketPriority from '../types/enums/ticketPriority.js';
import TicketStatus from '../types/enums/ticketStatus.js';
import Ticket from '../types/ticket.js';
import { gpPool } from '../dbConnection.js';
import { InventoryType } from '../services/inventoryReadyService.js';

interface TicketRowStructure {
	ticketid: string;
	authorid: string;
	projectid: string;
	title: string;
	description: string;
	currentstatus: string;
	ticketpriority: string;
	attachments: string[];
	deleted: boolean;
	creationdate: Date;
}

/**
 * The TicketInventory class is used to act as a data access layer for CRUD operations
 * relating to tickets. This inventory also covers assigning tickets to users.
 * 
 * To assign tags to a ticket, see [TagInventory]() - **NOT IMPLEMENTED**
 * TODO: Update the above link when the TagInventory class is implemented.
 */
class TicketInventory {
	constructor (
		private bgCore : BugtrackCore,
	) {
		// Bind all of the callbacks to the this object to avoid errors.
		this.invReadyCallback.bind(this);
		this.ticketUpdateCallback.bind(this);
		this.initialiseTicketCache.bind(this);
		
		// Listen for the required inventory ready events before initialising the class
		this.bgCore.invReady.eventEmitter.on('userInventoryReady', () => this.invReadyCallback());
		this.bgCore.invReady.eventEmitter.on('projectMemberInventoryReady', () => this.invReadyCallback());
	}

	/**
	 * The map for holding all tickets.
	 */
	private ticketMap : Map<string, Ticket> = new Map();

	private invReadyCallback() {
		this.bgCore.invReady.areInventoriesReady(
			[
				InventoryType.userInventory,
				InventoryType.projectMemberInventory,
			],
			() => this.initialiseTicketCache(),
		);
	}

	private async initialiseTicketCache() {
		// Get all tickets from the database.
		const ticketDataRaw : QueryResult<TicketRowStructure> = await gpPool.query('SELECT * FROM tickets WHERE deleted = $1;', [false]);
		const ticketData = ticketDataRaw.rows;

		// Convert the ticket data into ticket objects.
		for (const ticket of ticketData) {
			// Define the ticket priority and ticket status variables.
			let ticketPriority : TicketPriority;
			let ticketStatus : TicketStatus;

			// Define the ticket priority depending on what came out the DB.
			switch (ticket.ticketpriority) {
				case 'Low':
					ticketPriority = TicketPriority.low;
					break;
				case 'Medium':
					ticketPriority = TicketPriority.medium;
					break;
				case 'High':
					ticketPriority = TicketPriority.high;
					break;
				default:
					ticketPriority = TicketPriority.low;
					break;
			}

			// Same for the ticket status.
			switch (ticket.currentstatus) {
				case 'Closed':
					ticketStatus = TicketStatus.closed;
					break;
				case 'WiP':
					ticketStatus = TicketStatus.wip;
					break;
				case 'Open':
					ticketStatus = TicketStatus.open;
					break;
				default:
					ticketStatus = TicketStatus.open;
					break;
			}

			// Create the ticket object.
			const ticketObj = new Ticket(
				this.bgCore,
				ticket.ticketid,
				this.bgCore.projectMemberInventory.getMemberByID(ticket.authorid) ||
				(await this.bgCore.userManagerInventory.getUserStubByID(ticket.authorid))!,
				(await this.bgCore.projectInventory.noCacheGetProjectByID(ticket.projectid))!,
				ticketPriority,
				ticketStatus,
				[], // TODO: Tag inventory not implemented.
				[], // TODO: Need to implement the assigned members CRUD stuff.
				ticket.title,
				ticket.description,
				ticket.attachments,
				[], // TODO: Comment inventory not implemented.
				ticket.creationdate,
			);

			// Add the new ticket object to cache.
			this.ticketMap.set(ticket.ticketid, ticketObj);
		}
	}

	private async ticketUpdateCallback(ticketID : string) {
		const ticketDataRaw : QueryResult<TicketRowStructure> =
			await gpPool.query('SELECT * FROM tickets WHERE ticketid = $1;', [ticketID]);
		
		if (!ticketDataRaw.rows.length) {
			this.ticketMap.delete(ticketID);
			return;
		}

		const ticket = ticketDataRaw.rows[0];

		// Define the ticket priority and ticket status variables.

		let ticketPriority : TicketPriority;
		let ticketStatus : TicketStatus;

		// Define the ticket priority depending on what came out the DB.
		switch (ticket.ticketpriority) {
			case 'Low':
				ticketPriority = TicketPriority.low;
				break;
			case 'Medium':
				ticketPriority = TicketPriority.medium;
				break;
			case 'High':
				ticketPriority = TicketPriority.high;
				break;
			default:
				ticketPriority = TicketPriority.low;
				break;
		}

		// Same for the ticket status.
		switch (ticket.currentstatus) {
			case 'Closed':
				ticketStatus = TicketStatus.closed;
				break;
			case 'WiP':
				ticketStatus = TicketStatus.wip;
				break;
			case 'Open':
				ticketStatus = TicketStatus.open;
				break;
			default:
				ticketStatus = TicketStatus.open;
				break;
		}

		// Create the ticket object.
		const ticketObj = new Ticket(
			this.bgCore,
			ticket.ticketid,
			this.bgCore.projectMemberInventory.getMemberByID(ticket.authorid) ||
			(await this.bgCore.userManagerInventory.getUserStubByID(ticket.authorid))!,
			this.bgCore.projectInventory.getProjectByID(ticket.projectid),
			ticketPriority,
			ticketStatus,
			[], // TODO: Tag inventory not implemented.
			[], // TODO: Need to implement the assigned members CRUD stuff.
			ticket.title,
			ticket.description,
			ticket.attachments,
			[], // TODO: Comment inventory not implemented.
			ticket.creationdate,
		);

		// Add the new ticket object to cache.
		this.ticketMap.set(ticket.ticketid, ticketObj);
	}

	/**
	 * 
	 * @param ticketID 
	 * @returns 
	 */
	public getTicketByID(ticketID : string) : Ticket | null {
		return this.ticketMap.get(ticketID) || null;
	}
}

export default TicketInventory;