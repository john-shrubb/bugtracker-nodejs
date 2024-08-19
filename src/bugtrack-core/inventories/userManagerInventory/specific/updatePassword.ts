import bcrypt from 'bcrypt';
import { umPool } from '../../../dbConnection.js';
import User from '../../../types/user.js';
import BugtrackCore from '../../../index.js';

async function updatePassword(
	user: User,
	oldPassword: string,
	newPassword: string,
	bgCore: BugtrackCore,
) {
	// Check that user exists.
	if (!(await bgCore.userInventory.noCacheGetUserByID(user.id))) {
		throw new Error('Attempted to update password for non existent user.', {
			cause: user,
		});
	}

	// Check that the old password is correct.
	const userPassHash: string = (
		await umPool.query('SELECT pass FROM users WHERE userid=$1;', [user.id])
	).rows[0][0];

	// Compare and throw error if old password is incorrect.
	if (!(await bcrypt.compare(oldPassword, userPassHash))) {
		throw new Error('Attempted to update password with incorrect old password.');
	}

	const newPassHash = await bcrypt.hash(newPassword, 13);

	// Update the password in the database.
	await umPool.query('UPDATE users SET pass=$1 WHERE userid=$2;', [newPassHash, user.id]);
}

export default updatePassword;
