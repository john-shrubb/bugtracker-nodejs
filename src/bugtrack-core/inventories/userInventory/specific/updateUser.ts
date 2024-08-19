import { gpPool } from '../../../dbConnection.js';
import checkAttributeConstraint from '../../../helperFunctions/checkAttributeConstraint.js';
import BugtrackCore from '../../../index.js';
import PossibleEvents from '../../../types/enums/possibleEvents.js';
import UserAttributeType from '../../../types/enums/userAttributeType.js';
import User from '../../../types/user.js';

async function updateUser( // Adherance to 90 character line limit
	user : User,
	updateType : UserAttributeType,
	newValue : string,
	bgCore : BugtrackCore,
) {
	// This method cannot be used to update a password.
	if (updateType === UserAttributeType.password) {
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

	// USERNAME, EMAIL, PASSWORD, PFP

	if (!checkAttributeConstraint(newValue, updateType)) {
		throw new Error('Invalid format for user attribute update.', {
			cause: {
				user: user,
				value: newValue,
				updateType: updateType,
			},
		});
	}

	// Check if the user exists and throw an error if it does not.
	if (!bgCore.userInventory.getUserByID(user.id)) {
		const error = new Error('Could not find a user with ID ' + user.id);
		throw error;
	}

	// Mapping to map the enumerator to the column name in the database.
	const columnUpdateMapping = {
		[UserAttributeType.displayname]: 'displayname',
		[UserAttributeType.email]: 'email',
		[UserAttributeType.username]: 'username',
		[UserAttributeType.pfp]: 'pfp',
	};
	
	// Utilise column mapping by making a string with the appropriate column name in
	// it.
	const columnToUpdate = columnUpdateMapping[updateType];

	// I swear this should be secure, right? What could go wrong with SQL and string
	// interpolation????
	const query = `UPDATE usersgp SET ${columnToUpdate}=$1 WHERE userid=$2;`;
	
	// Query the database.
	await gpPool.query(
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

	bgCore.cacheInvalidation.notifyUpdate(PossibleEvents.user, user.id);
}

export default updateUser;