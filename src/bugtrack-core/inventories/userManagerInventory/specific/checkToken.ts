import Session from '../../../types/session.js';
import User from '../../../types/user.js';
import bcrypt from 'bcrypt';

async function checkToken(
	sessionToken : string,
	sessionMap : Map<string, Session>,
) : Promise<User | null> {
	// Variable to be assigned if the for loop matches a user.
	let foundUser : User | null = null;

	// For each key in the map...
	for (const sessionID in sessionMap) {
		// Get the session object...
		const session = sessionMap.get(sessionID)!;

		if (await bcrypt.compare(sessionToken, session.token)) {
			// If the token is a match, then return the correct user.
			foundUser = session.user;
		}
	}

	return foundUser;
}

export default checkToken;