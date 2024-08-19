import { QueryResult } from 'pg';
import { umPool } from '../../../dbConnection.js';
import UserStub from '../../../types/userStub.js';

async function getUserStubByID(userID: string): Promise<UserStub | null> {
	/**
	 * Interface for how the user data will be returned from the database.
	 */
	interface UserDataStruct {
		id: string;
		displayname: string;
		username: string;
		email: string;
	}

	// Query the database.
	const userDataRaw: QueryResult<UserDataStruct> = await umPool.query(
		'SELECT (userid, displayname, username, email) FROM users WHERE userid=$1, deleted=$2;',
		[userID, true],
	);

	// Check if there is a deleted user.
	if (!userDataRaw.rows.length) {
		return null;
	}

	const userData = userDataRaw.rows[0];

	const user = new UserStub(userData.id, userData.displayname, userData.username, userData.email);

	return user;
}

export default getUserStubByID;
