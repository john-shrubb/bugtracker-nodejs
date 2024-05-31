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
		).catch((reason) => {
			const error = new Error('Failed to initialise user cache.');
			error.cause = reason || 'Call to PostgreSQL failed for unknown reason.';
			throw error;
		});

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
		// For each item in the user cache...
		for (const key in this.userMap) {
			// Get the user object + Non null assertion as cache can be trusted.
			const user : User = this.userMap.get(key)!;
			// Check if the email matches.
			if (user.email === userEmail) {
				// Return if it does.
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
		// getUserByEmail works in much of the same way except it gets a user by a
		// different field.
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
		// This method cannot be used to update a password.
		if (updateType === UserUpdateType.password) {
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

		// username validation
		if (
			updateType === UserUpdateType.username &&
			(newValue.length < 3 || newValue.length > 30)
		) {
			// Build a cause which makes the issue more debuggable if something goes
			// wrong.
			const cause = {
				enumerator: updateType.toString(),
				passedValue: newValue,
			};
			
			// Build and throw error.
			const error = new Error('Invalid format for username. Must be >= 3 || <= 30.');
			error.cause = cause;
			throw error;
		}

		// displayname validation
		if (
			updateType === UserUpdateType.displayname &&
			(newValue.length < 3 || newValue.length > 50)
		) {
			// Cause
			const cause = {
				enumerator: updateType.toString(),
				passedValue: newValue,
			};

			// Error
			const error = new Error('Invalid format for displayname. Must be >= 3 || <= 50.');
			error.cause = cause;
			throw error;
		}

		// email validation
		// Similar/identical structure to above.
		if (
			updateType === UserUpdateType.email &&
			(newValue.length < 6 || newValue.length > 256)
		) {
			// Cause
			const cause = {
				enumerator: updateType.toString(),
				passedValue: newValue,
			};

			// Error
			const error = new Error('Invalid format for email. Must be >= 6 || <= 256.');
			error.cause = cause;
			throw error;
		}

		// Check if the user exists and throw an error if it does not.
		if (!this.getUserByID(user.id)) {
			const error = new Error('Could not find a user with ID ' + user.id);
			throw error;
		}

		// Mapping to map the enumerator to the column name in the database.
		const columnUpdateMapping = {
			[UserUpdateType.displayname]: 'displayname',
			[UserUpdateType.email]: 'email',
			[UserUpdateType.username]: 'username',
			[UserUpdateType.pfp]: 'pfp',
		};
		
		// Utilise column mapping by making a string with the appropriate column name in
		// it.
		const columnToUpdate = columnUpdateMapping[updateType];

		// I swear this should be secure, right? What could go wrong with SQL and string
		// interpolation????
		const query = `UPDATE usersgp SET ${columnToUpdate}=$1 WHERE userid=$2;`;
		
		// Query the database.
		await this.gpPool.query(
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

		this.bugtrackCore.cacheInvalidation.notifyUpdate(possibleEvents.user, user.id);
	}

	// See authentication inventory to delete user.
}

export default UserInventory;