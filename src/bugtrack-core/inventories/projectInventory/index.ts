import BugtrackCore from '../../index.js';
import Project from '../../types/project.js';
import User from '../../types/user.js';
import initialiseProjectCache from './core/initialiseProjectCache.js';
import invReadyCallback from './core/invReadyCallback.js';
import projectUpdateCallback from './core/projectUpdateCallback.js';
import noCacheGetProjectByID from './specific/noCacheGetProjectByID.js';
import createProject from './specific/createProject.js';
import deleteProject from './specific/deleteProject.js';
import updateProjectName from './specific/updateProjectName.js';
import updateProjectOwner from './specific/updateProjectOwner.js';

/**
 * The ProjectInventory class is used to act as a data access layer for CRUD operations
 * for projects.
 * 
 * This class does not cover ProjectMembers.
 * See [ProjectMemberInventory](./projectMemberInventory.ts).
 */

class ProjectInventory {
	constructor(
		private bgCore : BugtrackCore,
	) {

		// Bind the 'this' object to the callback otherwise it throws an error.
		this.invReadyCallback.bind(this);
		this.projectUpdateCallback.bind(this);
		this.initialiseProjectCache.bind(this);

		// The required inventory ready events before initialising the class.
		this.bgCore.invReady.eventEmitter.on('userInventoryReady', () => this.invReadyCallback());
		this.bgCore.invReady.eventEmitter.on('projectMemberInventoryReady', () => this.invReadyCallback());
		this.bgCore.invReady.eventEmitter.on('ticketInventoryReady', () => this.invReadyCallback());

		// Callback for updates to project object data.
		this.bgCore.cacheInvalidation.eventEmitter.on('projectUpdate',
			(id : string) => this.projectUpdateCallback(id)
		);
	}

	/**
	 * The cache for holding all projects. The key is the project ID and the value is the
	 * project object. Simple enough :-)
	 */
	private projectMap : Map<string, Project> = new Map();

	private invReadyCallback = () : void =>
		invReadyCallback(this.bgCore, this.initialiseProjectCache.bind(this));

	private initialiseProjectCache = async () : Promise<void> =>
		await initialiseProjectCache(this.bgCore);

	public projectUpdateCallback = async (projectID : string) : Promise<void> =>
		await projectUpdateCallback(projectID, this.bgCore, this.projectMap);

	/**
	 * Fetch a project object directly from the database bypassing cache. Useful if an up
	 * to date project object is required straight after an edit to the project object.
	 * @param projectID The ID of the project to be fetched.
	 * @returns A project object if the project exists, otherwise null.
	 */
	public noCacheGetProjectByID = async (projectID : string) : Promise<Project | null> =>
		await noCacheGetProjectByID(projectID, this.bgCore);

	/**
	 * Get a project by its ID.
	 * @param projectID The ID of the project to retrieve.
	 * @returns A project object if found, otherwise null.
	 */
	// It's not really worth moving this function to it's own file.
	public getProjectByID = (projectID : string) : Project | null =>
		this.projectMap.get(projectID) || null;

	/**
	 * Create a new project.
	 * @param name The display name of the project.
	 * @param author The user whom is creating the project.
	 */
	public async createProject(name : string, author : User) : Promise<string> {
		return await createProject(name, author, this.bgCore);
	}

	/**
	 * Delete a project from the database. Tickets made under the project will be
	 * preserved.
	 * @param projectID The ID of the project to be deleted.
	 */
	public deleteProject = async (projectID : string) : Promise<void> =>
		await deleteProject(projectID, this.bgCore);

	/**
	 * Update a project's display name.
	 * @param projectID The ID of the project to update.
	 * @param newName The new name of the project.
	 */
	public updateProjectName = async (projectID : string, newName : string) : Promise<void> =>
		await updateProjectName(projectID, newName, this.bgCore);

	/**
	 * Update the author of the project. The owner will keep their role.
	 * @param projectID The ID of the project to update.
	 * @param newOwner The new owner of the project.
	 */
	public updateProjectOwner = async (projectID : string, newOwner : User) : Promise<void> =>
		await updateProjectOwner(projectID, newOwner, this.bgCore);
}

export default ProjectInventory;