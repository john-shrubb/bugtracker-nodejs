import BugtrackCore from '../../';
import ProjectMember from '../../types/projectMember.js';
import User from '../../types/user.js';
import Project from '../../types/project.js';
import invReadyCallback from './core/invReadyCallback.js';
import initialiseProjectMemberCache from './core/initialiseProjectMemberCache.js';
import projectMemberUpdateCallback from './core/projectMemberUpdateCallback.js';
import noCacheGetMemberByID from './specific/noCacheGetMemberByID.js';
import getProjectMembersByProjectID from './specific/getProjectMembersByProjectID.js';
import getProjectMembersByUser from './specific/getProjectMembersByUser.js';
import assignUser from './specific/assignUser.js';
import unassignUser from './specific/unassignUser.js';

/**
 * The ProjectMemberInventory class is used to act as a data access layer for CRUD
 * operations for project members.
 * 
 * This class does not cover Projects.
 * See [ProjectInventory](./projectInventory.ts).
 */
class ProjectMemberInventory {
	/**
	 * @param bgCore The primary bugtrack core instance.
	 */
	constructor(
		private bgCore : BugtrackCore,
	) {
		this.invReadyCallback.bind(this);
		this.projectMemberUpdateCallback.bind(this);
		this.initialiseProjectMemberCache.bind(this);

		this.bgCore.invReady.eventEmitter.on('userInventoryReady', () => this.invReadyCallback());
		this.bgCore.invReady.eventEmitter.on('roleInventoryReady', () => this.invReadyCallback());

		this.bgCore.cacheInvalidation.eventEmitter.on('projectMemberUpdate', 
			(id : string) => this.projectMemberUpdateCallback(id)
		);
	}

	/**
	 * The cache holding all project members.
	 * string corresponds to a member ID.
	 * ProjectMember corresponds to the member object.
	 */
	private projectMemberMap : Map<string, ProjectMember> = new Map();

	private invReadyCallback = () =>
		invReadyCallback(this.bgCore, this.initialiseProjectMemberCache.bind(this));

	/**
	 * Initialise the cache of all project members in the database.
	 */
	private initialiseProjectMemberCache = async () =>
		await initialiseProjectMemberCache(this.bgCore);

	/**
	 * Callback function to be used when a project member is updated.
	 * @param memberID The ID of the project member that has been updated.
	 */
	public projectMemberUpdateCallback = async (memberID : string) =>
		projectMemberUpdateCallback(memberID, this.bgCore, this.projectMemberMap);

	/**
	 * Get a project member by their ID.
	 * @param memberID The ID of the member to get.
	 */
	public getMemberByID = (memberID : string) : ProjectMember | null =>
		this.projectMemberMap.get(memberID) || null;

	/**
	 * Get a project member by their ID straight from the database.
	 * @param memberID The ID of the member to attempt to get.
	 * @returns A project member if one is found. Otherwise, null is returned.
	 */
	public noCacheGetMemberByID = async (memberID : string) : Promise<ProjectMember | null> =>
		await noCacheGetMemberByID(memberID, this.bgCore);

	/**
	 * Get all project members under a project.
	 * @param projectID The ID of the project to get members for.
	 * @returns An array of ProjectMembers. If there are no members, an empty array is
	 * returned.
	 */
	public getProjectMembersByProjectID = (projectID : string) : ProjectMember[] =>
		getProjectMembersByProjectID(projectID, this.bgCore, this.projectMemberMap);

	/**
	 * Get all the projects of which a user is a member of.
	 * @param user The user to get the project member objects for.
	 * @returns An array of ProjectMember objects. If the user is not a member of any
	 * projects, an empty array is returned.
	 */
	public getProjectMembersByUser = (user : User) : ProjectMember[] =>
		getProjectMembersByUser(user, this.bgCore, this.projectMemberMap);

	/**
	 * Assign a user to a project.
	 * @param user The user to assign to the project.
	 * @param project The project to assign the user to.
	 */
	public assignUser = async (user : User, project : Project) =>
		await assignUser(user, project, this.bgCore);

	/**
	 * Remove a user from a project.
	 * @param projectMember The project member to remove from the project.
	 */
	public unassignUser = async (projectMember : ProjectMember) =>
		await unassignUser(projectMember, this.bgCore);
}

export default ProjectMemberInventory;