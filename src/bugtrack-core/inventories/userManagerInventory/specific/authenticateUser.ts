import { umPool } from '../../../dbConnection.js';
import generateID from '../../../helperFunctions/genID.js';
import BugtrackCore from '../../../index.js';
import { possibleEvents } from '../../../services/cacheInvalidationService.js';
import User from '../../../types/user.js';
import bcrypt from 'bcrypt';

async function authenticateUser(
	user: User,
	password: string,
	userAgent: string,
	ipAddress: string,
	bgCore: BugtrackCore,
): Promise<string | Error> {
	// Check user exists.
	if (!bgCore.userInventory.getUserByID(user.id)) {
		throw new Error('Attempted to authenticate non existent user.', {
			cause: user,
		});
	}

	// Grab user data from database.
	// This class avoids holding this data in memory for longer than required to
	// prevent security where a user may get access to a cache of hashed passwords.
	const userData: { pass: string } = (
		await umPool.query('SELECT pass FROM users WHERE userid=$1;', [user.id]).catch((reason) => {
			// Catch error incase DB query goes wrong.
			throw Error(
				'Something has gone wrong with fetching user authentication details. User that exists in cache not present in database.',
				{
					cause: {
						userObject: user,
						reason: reason,
					},
				},
			);
		})
	).rows[0]; // The first row will always be correct.

	const passwordCorrect = await bcrypt.compare(password, userData.pass.trim());

	// Insert a record of the login attempt to the database.
	await umPool.query(
		'INSERT INTO loginattempts (userid, successful, ipaddress, useragent) VALUES ($1, $2, $3, $4);',
		[user.id, passwordCorrect, ipAddress, userAgent],
	);

	if (passwordCorrect) {
		const token = await bcrypt.hash(crypto.randomUUID(), 13);
		const id = generateID();

		await umPool.query(
			'INSERT INTO sessions (sessiontoken, userid, useragent, issuedon, expireson, sessionid) VALUES ($1, $2, $3, $4, $5, $6);',
			[
				token,
				user.id,
				userAgent,
				new Date(),
				// Session life of 2 weeks.
				new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
				id,
			],
		);

		bgCore.cacheInvalidation.notifyUpdate(possibleEvents.session, id);

		return token;
	} else {
		// It wouldn't really make sense to throw an error for every single failed
		// authentication attempt.
		const error = new Error('Incorrect authentication details.');
		return error;
	}
}

export default authenticateUser;
