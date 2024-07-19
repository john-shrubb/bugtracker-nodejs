import BugtrackCore from '..';
import checkAttributeConstraint from '../helperFunctions/checkAttributeConstraint.js';
import checkID from '../helperFunctions/checkID.js';
import { InventoryType } from '../services/inventoryReadyService.js';
import PossibleEvents from '../types/enums/possibleEvents.js';
import UserAttributeType from '../types/enums/userAttributeType.js';
import User from '../types/user.js';
import { QueryResult } from 'pg';
import { gpPool } from '../dbConnection.js';

/**
 * A structure used to serialise the rows returned when querying the database.
 */
interface userRowStruct {
	userid: string;
	username: string;
	email: string;
	displayname: string;
	pfp: string;
	creationdate: Date;
}

/**
 * The user inventory is responsible for holding cache for all users and providing CRUD
 * methods to other objects.
 * 
 * **Note:** Users cannot be created using this inventory. See the
 *           [UserManagerInventory](./userManagerInventory.ts) to create users.
 */
class UserInventory {
	constructor(
		private bgCore : BugtrackCore,
	) {
		// User map which essentially acts as the cache.
		this.userMap = new Map<string, User>();

		// Set up cache invalidation to listen for user updates. Callback defined below.
		this.bgCore.cacheInvalidation.eventEmitter.on('userUpdate', this.userUpdateCallback);

		// Initialise class method builds the cache from whats in the database.
		// This may take some time depending on the size of the database.
		this.initialiseUserCache();

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
	 * Callback function for the event in which a user is updated.
	 * @param userID The ID of the user who has been deleted, modified or created.
	 */

	private async userUpdateCallback(userID : string) {
		// Grab the raw query for the user data.
		const userDataRaw : QueryResult<userRowStruct> = await gpPool.query(
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
		if (!userDataRaw.rows.length) {
			this.userMap.delete(userID);
			return;
		}

		// Otherwise create a new entry for them in the cache.
		this.userMap.set(userData.userid, new User(
			this.bgCore,
			userData.userid,
			userData.username,
			userData.email,
			userData.displayname,
			userData.pfp,
			userData.creationdate,
		));
	}

	/**
	 * Initialises the class by building the cache.
	 */
	private async initialiseUserCache() {
		// Grab all of the user data from the view.
		const allUserData : QueryResult<userRowStruct> = await gpPool.query(
			'SELECT userid, username, email, displayname, pfp, creationdate FROM usersgp;',
		).catch((reason) => {
			const error = new Error('Failed to initialise user cache.');
			error.cause = reason || 'Call to PostgreSQL failed for unknown reason.';
			throw error;
		});

		// For each row in the user data...
		allUserData.rows.forEach(userData => {
			// Create a new User class...
			const userToCreate = new User(
				this.bgCore,
				userData.userid,
				userData.username,
				userData.email,
				userData.displayname,
				userData.pfp,
				userData.creationdate
			);

			// And register it on the user map.
			this.userMap.set(userData.userid, userToCreate);
		});

		this.bgCore.inventoryReadyService.inventoryReady(InventoryType.userInventory);
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

	public getUserByID(userID : string, throwError = true) : User | null {
		// Format check the user ID.
		if (!checkID(userID) && throwError) {
			throw Error('Attempted to search for user with invalid ID: ' + userID);
		}

		// Will return either a user class or "null" if it doesn't exist.
		return this.userMap.get(userID) || null;
	}

	/**
	 * The same as getUserByID() but queries the database instead of the cache.
	 * Is intended to be as sem
	 */

	// Maximum line length requires the line to be formatted like this.
	public async noCacheGetUserByID(
		userID : string,
		throwError = true
	): Promise<User | null> {
		// Format check the user ID.
		if (!checkID(userID) && throwError) {
			throw Error('Attempted to query for a user with invalid ID: ' + userID);
		}

		// Code ripped from callback function. All the more reason to make me want to
		// implement a driver system later on.
		// Grab the raw query for the user data.
		const userDataRaw : QueryResult<userRowStruct> = await gpPool.query(
			'SELECT userid, username, email, displayname, pfp, creationdate FROM usersgp WHERE userid=$1;',
			[userID]
		).catch(reason => {
			const error = new Error(
				`Error while attempting to query database for user ID: ${userID}.`
			);
			error.cause = reason || 'Unknown error during connection to PostgreSQL.';
			throw error;
		});

		// Check if the user was found,
		if (!userDataRaw.rowCount) {
			return null;
		}

		// Grab the user data.
		const userData = userDataRaw.rows[0];

		// Construct a user object to return.
		const user = new User(
			this.bgCore,
			userData.userid,
			userData.username,
			userData.email,
			userData.displayname,
			userData.pfp,
			userData.creationdate,
		);

		// Return contrcuted user object.
		return user;
	}

	/**
	 * Attempt to find a user and get them by their email address. This function is less
	 * performant than getUserByID() and should not be preferred.
	 * 
	 * Returns null if no user is found.
	 * @param userEmail 
	 */
	public getUserByEmail(userEmail : string) : User | null {
		const users = Array.from(this.userMap.values());

		const user = users.filter(user => user.email === userEmail)[0];

		return user;
	}

	/**
	 * Attempt to get any user with a matching username.
	 * Try to use getUserByID if at all possible.
	 * 
	 * Returns null if no user is found.
	 * @param username 
	 */
	public getUserByUsername(username : string) : User | null {
		const users = Array.from(this.userMap.values());

		const user = users.filter(user => user.username === username)[0];

		return user;
	}

	/**
	 * Attempt to get the user by either their ID, email or username. Simply queries cache
	 * for all three types and returns upon a match.
	 * 
	 * If you know the identifier for the user then attempt to use that, this function
	 * may impact performance if used excessively.
	 */

	public queryUserIdentifier(identifier : string) : User | null {
		const userMatch = this.getUserByID(identifier, false) ||
		this.getUserByUsername(identifier) ||
		this.getUserByEmail(identifier) ||
		null;
		return userMatch;
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

	public async updateUser( // Adherance to 90 character line limit
		user : User,
		updateType : UserAttributeType,
		newValue : string
	) {
		// This method cannot be used to update a password.
		if (updateType === UserAttributeType.password) {
			const error = new TypeError('Passed invalid argument for updateType. Passwords must be updated via userManagerInventory.');
			error.cause = updateType;
			throw error;
		}

		// Trim the new value they want to set.
		// Constraints for parameters are as follows:
		// 3 <= username    <= 30
		// 6 <= email       <= 256
		// 3 <= displayname <= 50
		// PFP is exempt as it is a URL.
		newValue = newValue.trim();

		// Pass a seperate error if an empty string is passed in.
		// A cause isn't really necessary as it is perfectly assumable what was passed to
		// cause this error.
		if (newValue.length === 0) {
			const error = new Error('Cannot pass an empty string for newValue argument.');
			throw error;
		}

		// Length validation

		// USERNAME, EMAIL, PASSWORD, PFP

		if (!checkAttributeConstraint(newValue, updateType)) {
			throw new Error('Invalid format for user attribute update.', {
				cause: {
					user: user,
					value: newValue,
					updateType: updateType,
				},
			});
		}

		// Check if the user exists and throw an error if it does not.
		if (!this.getUserByID(user.id)) {
			const error = new Error('Could not find a user with ID ' + user.id);
			throw error;
		}

		// Mapping to map the enumerator to the column name in the database.
		const columnUpdateMapping = {
			[UserAttributeType.displayname]: 'displayname',
			[UserAttributeType.email]: 'email',
			[UserAttributeType.username]: 'username',
			[UserAttributeType.pfp]: 'pfp',
		};
		
		// Utilise column mapping by making a string with the appropriate column name in
		// it.
		const columnToUpdate = columnUpdateMapping[updateType];

		// I swear this should be secure, right? What could go wrong with SQL and string
		// interpolation????
		const query = `UPDATE usersgp SET ${columnToUpdate}=$1 WHERE userid=$2;`;
		
		// Query the database.
		await gpPool.query(
			query,
			[newValue, user.id]
		// And catch just to throw another more debuggable error out if something goes
		// wrong.
		).catch((reason) => {
			// Build a cause object with more details than otherwise.
			const cause = {
				rejectionReason: reason,
				updateType: updateType.toString(),
				query: query,
				newValString: newValue,
			};

			// Build the error with the cause.
			const error = new Error('Error updating user details. Check cause for more details.');
			error.cause = cause;

			// Throw the error.
			throw error;
		});

		this.bgCore.cacheInvalidation.notifyUpdate(PossibleEvents.user, user.id);
	}

	// See authentication inventory to delete user.
}

export default UserInventory;