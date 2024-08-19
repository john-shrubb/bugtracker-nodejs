import { umPool } from '../../../dbConnection.js';
import checkAttributeConstraint from '../../../helperFunctions/checkAttributeConstraint.js';
import generateID from '../../../helperFunctions/genID.js';
import BugtrackCore from '../../../index.js';
import { possibleEvents } from '../../../services/cacheInvalidationService.js';
import { InventoryType } from '../../../services/inventoryReadyService.js';
import UserAttributeType from '../../../types/enums/userAttributeType.js';
import bcrypt from 'bcrypt';

async function createUser(
	username: string,
	email: string,
	displayname: string,
	pfp: string | null,
	password: string,
	bgCore: BugtrackCore,
): Promise<string> {
	// Generate the new user's ID.
	const newUserID = generateID();

	// New validation to help prevent duplicate classes from being created.
	if (bgCore.invReady.isInventoryReady(InventoryType.userInventory)) {
		throw new Error(
			'Before creating new users, the UserInventory class must be fully initialised.',
		);
	}

	// Check that all the user attributes are of a valid format.
	if (
		!checkAttributeConstraint(username, UserAttributeType.username) ||
		!checkAttributeConstraint(email, UserAttributeType.email) ||
		!checkAttributeConstraint(displayname, UserAttributeType.displayname) ||
		!checkAttributeConstraint(pfp || '', UserAttributeType.pfp) // If PFP is null then just substitute an empty string to avoid an error.
	) {
		// Throw an error with bad strings in the cause object to help with debugging.
		throw new Error('Attempted to create user with invalid constraints.', {
			cause: {
				username: username,
				email: email,
				displayname: displayname,
				pfp: pfp,
			},
		});
	}

	if (
		bgCore.userInventory.getUserByUsername(username) ||
		bgCore.userInventory.getUserByEmail(email)
	) {
		throw new Error('Attempted to create with an already existing username or email address.');
	}

	const salt = await bcrypt.genSalt(13);
	const hashedPass = await bcrypt.hash(password, salt);

	await umPool.query(
		'INSERT INTO users (userid, username, email, displayname, pfp, pass) VALUES ($1, $2, $3, $4, $5, $6);',
		[newUserID, username, email, displayname, pfp, hashedPass],
	);

	// Notify the cache invalidation system of the new user.
	bgCore.cacheInvalidation.notifyUpdate(possibleEvents.user, newUserID);

	// Return an ID. Any function that needs instant access to the new user object
	// should use the no cache variant of getUserByID().
	return newUserID;
}

export default createUser;
