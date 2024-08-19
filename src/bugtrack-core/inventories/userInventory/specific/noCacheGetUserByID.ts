import { QueryResult } from 'pg';
import { gpPool } from '../../../dbConnection.js';
import checkID from '../../../helperFunctions/checkID.js';
import User from '../../../types/user.js';
import BugtrackCore from '../../../index.js';

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

async function noCacheGetUserByID(
	userID: string,
	throwError = true,
	bgCore: BugtrackCore,
): Promise<User | null> {
	// Format check the user ID.
	if (!checkID(userID) && throwError) {
		throw Error('Attempted to query for a user with invalid ID: ' + userID);
	}

	// Code ripped from callback function. All the more reason to make me want to
	// implement a driver system later on.
	// Grab the raw query for the user data.
	const userDataRaw: QueryResult<userRowStruct> = await gpPool
		.query(
			'SELECT userid, username, email, displayname, pfp, creationdate FROM usersgp WHERE userid=$1;',
			[userID],
		)
		.catch((reason) => {
			const error = new Error(
				`Error while attempting to query database for user ID: ${userID}.`,
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
		bgCore,
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

export default noCacheGetUserByID;
