import checkID from '../../../helperFunctions/checkID.js';
import User from '../../../types/user.js';

function getUserByID(
	userID : string,
	throwError = true,
	userMap : Map<string, User>
) : User | null {
	// Format check the user ID.
	if (!checkID(userID) && throwError) {
		throw Error('Attempted to search for user with invalid ID: ' + userID);
	}

	// Will return either a user class or "null" if it doesn't exist.
	return userMap.get(userID) || null;
}

export default getUserByID;