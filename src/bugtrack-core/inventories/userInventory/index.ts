import BugtrackCore from '../..';
import UserAttributeType from '../../types/enums/userAttributeType.js';
import User from '../../types/user.js';
import userUpdateCallback from './core/userUpdateCallback.js';
import initialiseUserCache from './core/initialiseUserCache.js';
import getUserByID from './specific/getUserByID.js';
import noCacheGetUserByID from './specific/noCacheGetUserByID.js';
import updateUser from './specific/updateUser.js';

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

		this.userUpdateCallback.bind(this);

		// Set up cache invalidation to listen for user updates. Callback defined below.
		this.bgCore.cacheInvalidation.eventEmitter.on('userUpdate', (id : string) => this.userUpdateCallback(id));

		// Initialise class method builds the cache from whats in the database.
		// This may take some time depending on the size of the database.
		this.initialiseUserCache();
	}

	/**
	 * Map used to keep a cache of all affected users.
	 */
	private userMap;

	/**
	 * Callback function for the event in which a user is updated.
	 * @param userID The ID of the user who has been deleted, modified or created.
	 */

	public userUpdateCallback = async (userID : string) =>
		await userUpdateCallback(userID, this.bgCore, this.userMap);

	/**
	 * Initialises the class by building the cache.
	 */
	private initialiseUserCache = async () =>
		await initialiseUserCache(this.bgCore);
		

	// CRUD functions

	// Read functions

	/**
	 * Get a user by their ID. Returns user class, or null if no user is found. Getting a
	 * user by their ID is recommended for performance over a username or email as this
	 * does not require looping through each class.
	 * 
	 * Returns null if no user is found.
	 * @param userID The ID of the user you are searching for.
	 * @param throwError Whether or not to throw an error if the ID is invalid.
	 */

	public getUserByID = (userID : string, throwError = true) : User | null =>
		getUserByID(userID, throwError, this.userMap);

	/**
	 * The same as getUserByID() but queries the database instead of the cache.
	 * Is intended to be as sem
	 */

	public noCacheGetUserByID = async (userID : string, throwError = true): Promise<User | null> =>
		await noCacheGetUserByID(userID, throwError, this.bgCore);

	/**
	 * Attempt to find a user and get them by their email address. This function is less
	 * performant than getUserByID() and should not be preferred.
	 * 
	 * Returns null if no user is found.
	 * @param userEmail 
	 */
	public getUserByEmail = (userEmail : string) : User | null =>
		Array.from(this.userMap.values()).filter(user => user.email === userEmail)[0] || null;

	/**
	 * Attempt to get any user with a matching username.
	 * Try to use getUserByID if at all possible.
	 * 
	 * Returns null if no user is found.
	 * @param username 
	 */
	public getUserByUsername = (username : string) : User | null =>
		Array.from(this.userMap.values()).filter(user => user.username === username)[0] || null;

	/**
	 * Attempt to get the user by either their ID, email or username. Simply queries cache
	 * for all three types and returns upon a match.
	 * 
	 * If you know the identifier for the user then attempt to use that, this function
	 * may impact performance if used excessively.
	 */

	public queryUserIdentifier = (identifier : string) : User | null =>
		this.getUserByID(identifier, false) ||
		this.getUserByEmail(identifier) ||
		this.getUserByUsername(identifier) ||
		null;

	// Update functions

	/**
	 * Update a non-protected field in a user. See userManagerInventory to update
	 * passwords.
	 * 
	 * @param user The user you want to update.
	 * @param updateType The type of update you want to perform.
	 * @param newValue The new value of the field you want to change.
	 */

	public updateUser = async (user : User, updateType : UserAttributeType, newValue : string) =>
		await updateUser(user, updateType, newValue, this.bgCore);

	// See authentication inventory to delete user.
}

export default UserInventory;