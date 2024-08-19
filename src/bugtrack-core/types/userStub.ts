/**
 * An object used to represent a semi-anonymised user which has been deleted, can be used
 * to still display a user as the author of a ticket/comment/project even when the user
 * has been deleted.
 */

import checkID from '../helperFunctions/checkID.js';

class UserStub {
	/**
	 * @param id The ID used to reference the user.
	 * @param displayName The display name shown to other users.
	 * @param username The username of the former user.
	 * @param email The user's email address.
	 */
	constructor(
		public id: string,
		public displayName: string,
		public username: string,
		public email: string,
	) {
		// Check format of user ID.
		if (!checkID(id)) {
			throw new Error('Attempted to create UserStub with invalid user ID.');
		}
	}
}

export default UserStub;
