import { QueryResult } from 'pg';
import { gpPool } from '../../dbConnection.js';
import { InventoryType } from '../../services/inventoryReadyService.js';
import BugtrackCore from '../../index.js';

async function initialiseProjectCache(bgCore : BugtrackCore) {
	// Fetch all projects from the database
	const projects : QueryResult<{ projectid: string }> = await gpPool.query('SELECT projectid FROM projects;');

	// Array using the ProjectDataStructure interface
	const projectData = projects.rows;

	// Iterate through the projectData array and create a new Project object for each
	for (const project of projectData) {
		await bgCore.projectInventory.projectUpdateCallback(project.projectid);
	}

	// Mark this inventory as ready.
	bgCore.invReady.inventoryReady(InventoryType.projectInventory);
}

export default initialiseProjectCache;