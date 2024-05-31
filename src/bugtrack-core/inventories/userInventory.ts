import BugtrackCore from '..';
import checkID from '../helperFunctions/checkID.js';
import { possibleEvents } from '../services/cacheInvalidationService';
import UserUpdateType from '../types/enums/userUpdateType.js';
import User from '../types/user.js';
import { PoolClient, QueryResult } from 'pg';

/**
 * A structure used to serialise the rows returned when querying the database.
 */
interface userRowStruct {
	userid: string;
	username: string;
	email: string;
	displayname: string;
	pfp: string;
	creationDate: Date;
}

/**
 * The user inventory is responsible for holding cache for all users and providing CRUD
 * methods to other objects.
 * 
 * **Note:** Users cannot be created using this inventory. See the userManagerInventory
 *           to create users.
 */

class UserInventory {
	constructor(bugtrackCore : BugtrackCore, gpPool : PoolClient ) {
		// User map which essentially acts as the cache.
		this.userMap = new Map<string, User>();

		// The instance of the GP pool passed in from the BugtrackCore instance.
		this.gpPool = gpPool;

		// The instance of BugtrackCore
		this.bugtrackCore = bugtrackCore;

		// Set up cache invalidation to listen for user updates. Callback defined below.
		this.bugtrackCore.cacheInvalidation.on('userUpdate', this.userUpdateCallback);

		// Initialise class method builds the cache from whats in the database.
		// This may take some time depending on the size of the database.
		this.initialiseClass();

		// Just an idea, another temporary service which all inventories report they are
		// ready to when they have finished initalising, at which point the service will
		// emit a ready event. Could potentially allow for the API to delay till the rest
		// of the app is ready before starting.

		// Honestly, since this whole project won't find itself in any production
		// environments, maybe that won't be necessary. And who starts attempting to use
		// API the millisecond it turns on?

		// would be kinda cool tho...
	}

	/**
	 * Map used to keep a cache of all affected users.
	 */
	private userMap;

	/**
	 * Connection to PostgreSQL.
	 */

	private gpPool;

	/**
	 * BugtrackCore instance
	 */

	private bugtrackCore;

	/**
	 * Callback function for the event in which a user is updated.
	 * @param userID The ID of the user who has been deleted, modified or created.
	 */

	private async userUpdateCallback(userID : string) {
		// Grab the raw query for the user data.
		const userDataRaw : QueryResult<userRowStruct> = await this.gpPool.query(
			'SELECT userid, username, email, displayname, pfp, creationdate FROM usersgp WHERE userid=$1;',
			[userID]
		).catch(reason => {
			const error = new Error(
				`Error while attempting to query database for user ID: ${userID}.`
			);
			error.cause = reason;
			throw error;
		});

		// Simplify down from QueryResult to userRowStruct.
		const userData = userDataRaw.rows[0];

		// If there is no longer that user in the database then wipe them from cache.
		if (!userDataRaw.rowCount) {
			this.userMap.delete(userID);
			return;
		}

		// Otherwise create a new entry for them in the cache.
		this.userMap.set(userData.userid, new User(
			this.bugtrackCore,
			userData.userid,
			userData.username,
			userData.email,
			userData.displayname,
			userData.pfp,
			userData.creationDate
		));
	}

	/**
	 * Initialises the class by building the cache.
	 */
	private async initialiseClass() {
		// Grab all of the user data from the view.
		const allUserData : QueryResult<userRowStruct> = await this.gpPool.query(
			'SELECT userid, username, email, displayname, pfp, creationdate FROM usersgp;',
		);

		// For each row in the user data...
		allUserData.rows.forEach(userData => {
			// Create a new User class...
			const userToCreate = new User(
				this.bugtrackCore,
				userData.userid,
				userData.username,
				userData.email,
				userData.displayname,
				userData.pfp,
				userData.creationDate
			);

			// And register it on the user map.
			this.userMap.set(userData.userid, userToCreate);
		});
	}

	// CRUD functions

	// Read functions

	/**
	 * Get a user by their ID. Returns user class, or null if no user is found. Getting a
	 * user by their ID is recommended for performance over a username or email as this
	 * does not require looping through each class.
	 * 
	 * Returns null if no user is found.
	 * @param userID The ID of the user you are searching for.
	 */

	public getUserByID(userID : string) : User | null {
		// Format check the user ID.
		if (!checkID(userID)) {
			throw Error('Attempted to search for user with invalid ID: ' + userID);
		}

		// Will return either a user class or "null" if it doesn't exist.
		return this.userMap.get(userID) || null;
	}

	/**
	 * Attempt to find a user and get them by their email address. This function is less
	 * performant than getUserByID() and should not be preferred.
	 * 
	 * Returns null if no user is found.
	 * @param userEmail 
	 */
	public getUserByEmail(userEmail : string) : User | null {
		for (const key in this.userMap) {
			const user : User = this.userMap.get(key)!;
			if (user.email === userEmail) {
				return user;
			}
		}

		return null;
	}

	/**
	 * Attempt to get any user with a matching username.
	 * Try to use getUserByID if at all possible.
	 * 
	 * Returns null if no user is found.
	 * @param username 
	 */
	public getUserByUsername(username : string) : User | null {
		for (const key in this.userMap) {
			const user : User = this.userMap.get(key)!;
			if (user.username === username) {
				return user;
			}
		}

		return null;
	}

	// Update functions

	/**
	 * Update a non-protected field in a user. See userManagerInventory to update
	 * passwords.
	 * 
	 * @param user The user you want to update.
	 * @param updateType The type of update you want to perform.
	 * @param newValue The new value of the field you want to change.
	 */

	public async updateUser(user : User, updateType : UserUpdateType, newValue : string) {
		if (updateType === UserUpdateType.password) {
			const error = new TypeError('Passed invalid argument for updateType. Passwords must be updated via userManagerInventory.');
			throw error;
		}

		newValue = newValue.trim();

		if (newValue.length === 0) {
			const error = new Error('Cannot pass an empty string for newValue argument.');
			throw error;
		}

		if (!this.getUserByID(user.id)) {
			const error = new Error('Could not find a user with ID ' + user.id);
			throw error;
		}

		const columnUpdateMapping = {
			[UserUpdateType.displayname]: 'displayname',
			[UserUpdateType.email]: 'email',
			[UserUpdateType.username]: 'username',
			[UserUpdateType.pfp]: 'pfp',
		};
		
		const columnToUpdate = columnUpdateMapping[updateType];

		this.gpPool.query(`UPDATE usersgp SET ${columnToUpdate}=$1 WHERE userid=$2;`);

		this.bugtrackCore.cacheInvalidation.notifyUpdate(possibleEvents.user, user.id);
	}

	// See authentication inventory to delete user.
}

export default UserInventory;