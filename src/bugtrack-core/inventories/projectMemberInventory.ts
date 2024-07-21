import BugtrackCore from '..';
import ProjectMember from '../types/projectMember.js';
import { QueryResult } from 'pg';
import { gpPool } from '../dbConnection.js';
import generateID from '../helperFunctions/genID.js';
import User from '../types/user.js';
import Project from '../types/project.js';
import PossibleEvents from '../types/enums/possibleEvents.js';
import { InventoryType } from '../services/inventoryReadyService.js';

interface ProjectMemberDataStructure {
	memberid: string;
	userid: string;
	projectid: string;
	joindate: Date;
}

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

	private invReadyCallback() {
		this.bgCore.invReady.areInventoriesReady(
			[
				InventoryType.userInventory,
				InventoryType.roleInventory,
			],
			() => this.initialiseProjectMemberCache(),
		);
	}
	/**
	 * The cache holding all project members.
	 * string corresponds to a member ID.
	 * ProjectMember corresponds to the member object.
	 */
	private projectMemberMap : Map<string, ProjectMember> = new Map();

	/**
	 * Initialise the cache of all project members in the database.
	 */
	private async initialiseProjectMemberCache() {
		const projectMembersRaw : QueryResult<{ memberid: string }> =
			await gpPool.query('SELECT memberid FROM projectmembers WHERE removed = $1;', [false]);

		const projectMembers = projectMembersRaw.rows;

		for (const memberData of projectMembers) {
			await this.projectMemberUpdateCallback(memberData.memberid);
		}

		this.bgCore.invReady.inventoryReady(
			InventoryType.projectMemberInventory
		);
	}

	/**
	 * Callback function to be used when a project member is updated.
	 * @param memberID The ID of the project member that has been updated.
	 */
	private async projectMemberUpdateCallback(memberID : string) {
		const member = await this.noCacheGetMemberByID(memberID);
		
		if (!member) {
			this.projectMemberMap.delete(memberID);
			return;
		}

		this.projectMemberMap.set(memberID, member);
	}

	/**
	 * Get a project member by their ID.
	 * @param memberID The ID of the member to get.
	 */
	public getMemberByID(memberID : string) : ProjectMember | null {
		return this.projectMemberMap.get(memberID) || null;
	}

	/**
	 * Get a project member by their ID straight from the database.
	 * @param memberID The ID of the member to attempt to get.
	 * @returns A project member if one is found. Otherwise, null is returned.
	 */
	public async noCacheGetMemberByID(memberID : string) : Promise<ProjectMember | null> {
		// Query the database for the member data.
		const memberDataRaw : QueryResult<ProjectMemberDataStructure> =
			await gpPool.query('SELECT * FROM projectmembers WHERE memberid = $1 AND removed = $2;', [memberID, false]);
		
		// If the member doesn't exist, return null.
		if (!memberDataRaw.rows.length) {
			return null;
		}

		// Get the member data itself.
		const memberData : ProjectMemberDataStructure = memberDataRaw.rows[0];

		// Get the parent project object.
		const parentProject =
			await this.bgCore.projectInventory.noCacheGetProjectByID(memberData.projectid);
		
		// If the parent project doesn't exist, throw an error.
		if (!parentProject) {
			throw new Error('Parent project not found for project member.', {
				cause: {
					memberID: memberData.memberid,
					projectID: memberData.projectid,
				},
			});
		}

		// Create the ProjectMember object.
		const member = new ProjectMember(
			this.bgCore,
			memberData.memberid,
			(await this.bgCore.userInventory.noCacheGetUserByID(memberData.userid))!,
			parentProject,
			this.bgCore.roleInventory.getRoleByProjectMemberID(memberData.memberid),
			memberData.joindate,
		);

		return member;
	}

	/**
	 * Get all project members under a project.
	 * @param projectID The ID of the project to get members for.
	 * @returns An array of ProjectMembers. If there are no members, an empty array is
	 * returned.
	 */
	public getProjectMembersByProjectID(projectID : string) : ProjectMember[] {
		// Check the project exists. Throw an error if it doesn't.
		if (!this.bgCore.projectInventory.getProjectByID(projectID)) {
			throw new Error('Project does not exist.', {
				cause: projectID,
			});
		}

		// Convert the map to an array of project members.
		const projectMembers = Array.from(this.projectMemberMap.values());

		// Return a filtered array of the project members in the project.
		return projectMembers.filter(member => member.project.id === projectID);
	}

	/**
	 * Get all the projects of which a user is a member of.
	 * @param user The user to get the project member objects for.
	 * @returns An array of ProjectMember objects. If the user is not a member of any
	 * projects, an empty array is returned.
	 */
	public getProjectMembersByUser(user : User) : ProjectMember[] {
		// Check the user actually exists. If they don't, throw an error.
		if (!this.bgCore.userInventory.getUserByID(user.id)) {
			throw new Error('User does not exist', {
				cause: user,
			});
		}

		// Convert the map to an array of project members.
		const projectMembers = Array.from(this.projectMemberMap.values());

		return projectMembers.filter(
			// If the project member ID matches.
			member => member.user.id === user.id ||
			// If the author of the project is the user
			member.project.owner.id === user.id
		);
	}

	/**
	 * Assign a user to a project.
	 * @param user The user to assign to the project.
	 * @param project The project to assign the user to.
	 */

	public async assignUser(user : User, project : Project) {
		// Check if the user exists.
		if (!this.bgCore.userInventory.getUserByID(user.id)) {
			throw new Error('User does not exist.');
		}

		// Check if the project exists.
		if (!this.bgCore.projectInventory.getProjectByID(project.id)) {
			throw new Error('Project does not exist.');
		}
		
		// Check if the user is already a member of the project.
		if (
			this.getProjectMembersByUser(user)
				.some(member => member.project.id === project.id)
		) {
			throw new Error('User is already a member of the project.', {
				cause: {
					project: project,
					user: user,
				},
			});
		}

		// Generate a new ID for the project member.
		const memberID = generateID();

		// Add the project member to the database.
		await gpPool.query(
			'INSERT INTO projectmembers (memberid, userid, projectid) VALUES ($1, $2, $3);',
			[memberID, user.id, project.id],
		);

		// Notify of the new project member.
		this.bgCore.cacheInvalidation.notifyUpdate(
			PossibleEvents.projectmember, memberID
		);
	}

	/**
	 * Remove a user from a project.
	 * @param projectMember The project member to remove from the project.
	 */

	public async unassignUser(projectMember : ProjectMember) {
		// Check if the project member exists.
		if (!this.projectMemberMap.has(projectMember.id)) {
			throw new Error('Project member does not exist.', {
				cause: projectMember,
			});
		}

		// Remove the project member from the database.
		await gpPool.query(
			'UPDATE projectmembers SET removed = $1 WHERE memberid = $2;',
			[true, projectMember.id],
		);

		// Notify of the project member removal.
		this.bgCore.cacheInvalidation.notifyUpdate(
			PossibleEvents.projectmember, projectMember.id
		);

		return;
	}
}

export default ProjectMemberInventory;