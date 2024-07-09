/**
 * The ProjectInventory class is used to act as a data access layer for CRUD operations
 * for projects.
 * 
 * This class does not cover ProjectMembers. See ProjectMemberInventory (Hyperlink will
 * be inserted later).
 */

import { QueryResult } from 'pg';
import { gpPool } from '../dbConnection.js';
import BugtrackCore from '../index.js';
import Project from '../types/project.js';
import User from '../types/user.js';
import generateID from '../helperFunctions/genID.js';
import PossibleEvents from '../types/enums/possibleEvents.js';

interface ProjectDataStructure {
	projectID : string;
	displayName : string;
	ownerID : string;
	creationDate : Date;
}

class ProjectInventory {
	constructor(
		private bgCore : BugtrackCore,
	) {
		this.initialiseProjectCache();

		this.bgCore.cacheInvalidation.on('projectUpdate', this.projectUpdateCallback);
	}
	/**
	 * The cache for holding all projects.
	 */
	private projectMap : Map<string, Project> = new Map();

	/**
	 * Initialise the cache of all projects in the database.
	 */
	private async initialiseProjectCache() {
		// Fetch all projects from the database
		const projects : QueryResult<ProjectDataStructure> = await gpPool.query('SELECT projectid, displayname, ownerid, creationdate FROM projects;');

		// Array using the ProjectDataStructure interface
		const projectData : ProjectDataStructure[] = projects.rows;

		// Iterate through the projectData array and create a new Project object for each

		for (const project of projectData) {
			const newProject = new Project(
				this.bgCore,
				project.projectID,
				project.displayName,
				this.bgCore.userInventory.getUserByID(project.ownerID) ||
				// Just incase the user is not in the cache
				// eslint-disable-next-line max-len
				(await this.bgCore.userManagerInventory.getUserStubByID(project.ownerID))!,
				[], // POPULATE THESE LATER
				[],
				project.creationDate,
			);

			this.projectMap.set(project.projectID, newProject);
		}
	}

	public async projectUpdateCallback(projectID : string) {
		// Fetch project from the database.
		const projectData : QueryResult<ProjectDataStructure> = await gpPool.query('SELECT projectid, displayname, ownerid, creationdate FROM projects WHERE projectid = $1;', [projectID]);

		// If the project doesn't exist anymore then delete it from the cache.
		if (!projectData.rows.length) {
			this.projectMap.delete(projectID);
			return;
		}

		// Otherwise, add it to the cache.
		const project = projectData.rows[0];

		// Create the project object.
		const newProject = new Project(
			this.bgCore,
			project.projectID,
			project.displayName,
			this.bgCore.userInventory.getUserByID(project.ownerID) ||
			// Just incase the user is not in the cache
			(await this.bgCore.userManagerInventory.getUserStubByID(project.ownerID))!,
			[], // POPULATE THESE LATER
			[],
			project.creationDate,
		);

		// Add the project to the cache.
		this.projectMap.set(project.projectID, newProject);
	}

	/**
	 * Fetch a project object directly from the database bypassing cache. Useful if an up
	 * to date project object is required straight after an edit to the project object.
	 * 
	 * Preferably use `getProjectById()` if the project object can be out of date by a few
	 * seconds.
	 * @param projectID The ID of the project to be fetched.
	 * @returns A project object if the project exists, otherwise null.
	 */
	public async noCacheGetProjectById(projectID : string) : Promise<Project | null> {
		// Get the project data from the database.
		const projectData : QueryResult<ProjectDataStructure> = await gpPool.query('SELECT projectid, displayname, ownerid, creationdate FROM projects WHERE projectid = $1;', [projectID]);
		
		// If the project doesn't exist then just return null.
		if (!projectData.rows.length) {
			return null;
		}

		// Get the object itself with the project data.
		const project = projectData.rows[0];

		// Create the project object.
		const projectObject = new Project(
			this.bgCore,
			project.projectID,
			project.displayName,
			this.bgCore.userInventory.getUserByID(project.ownerID) ||
			// Just incase the user is not in the cache
			(await this.bgCore.userManagerInventory.getUserStubByID(project.ownerID))!,
			[], // POPULATE THESE LATER
			[],
			project.creationDate,
		);

		// Return the project object.
		return projectObject;
	}

	public getProjectById(projectID : string) : Project | null {
		return structuredClone(this.projectMap.get(projectID)) || null;
	}

	public async createProject(
		name : string,
		author : User,
	) {
		// Validate the project name and author.
		if (name.trim() === '') {
			throw new Error('Project name cannot be empty.');
		}

		// Check whether the author actually exists.
		if (!this.bgCore.userInventory.getUserByID(author.id)) {
			throw new Error('Author does not exist.');
		}

		// Genereate a new ID for the project.
		const id = generateID();

		// Add the project to the database.
		await gpPool.query(
			'INSERT INTO projects (projectid, displayname, ownerid, creationdate) VALUES ($1, $2, $3, $4);',
			[id, name, author.id, new Date()]
		);

		// Notify the cache invalidation service of the update.
		this.bgCore.cacheInvalidation.notifyUpdate(PossibleEvents.project, id);

		return;
	}
}

export default ProjectInventory;