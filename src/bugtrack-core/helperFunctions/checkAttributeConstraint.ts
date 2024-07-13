import UserAttributeType from '../types/enums/userAttributeType.js';

/**
 * Check the formatting of an account's attributes. userid is a seperate type of attribute
 * checked in [checkID](./checkID.ts).
 * @param value The value you wish to check complies with the constraints 
 * @param attributeType Can be displayname, email, PFP or username. Password will throw an
 * error.
 */
function checkAttributeConstraint(
	value : string,
	attributeType : UserAttributeType
) : boolean {

	// This structure of if statement reduces the amount of jumps it takes to get a return
	// value, therefore saving maybe like 2 nanoseconds per statement if I'm lucky.

	// Display names
	if (attributeType === UserAttributeType.displayname) {
		// A display name can have pretty much whatever the user wants in it.
		// It's down to project owners/admins to moderate what is acceptable.
		// Some users may also have names in cryllic or other character sets.
		if (value.length < 3 || value.length > 50) return false;

		return true;
	}

	// Usernames
	if (attributeType === UserAttributeType.username) {
		// eslint-disable-next-line max-len
		// Credit: https://stackoverflow.com/questions/12018245/regular-expression-to-validate-username
		// Adapted Regex from above link, only lower case letters are allowed.
		const usernameRegex = /^[a-z]+$/;

		// Format check.
		if (!usernameRegex.test(value)) return false;

		// Length check
		if (value.length < 3 || value.length > 30) return false;

		return true;
	}

	// Emails
	if (attributeType === UserAttributeType.email) {
		// eslint-disable-next-line max-len
		// Credit: https://emaillistvalidation.com/blog/mastering-email-validation-in-typescript-the-ultimate-guide-for-error-free-communication/
		const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

		// Check format of email.
		if (!emailRegex.test(value)) return false;

		// Check length of email.
		if (value.length < 6 || value.length > 256) return false;
		return true;
	}

	// Profile picture URLs
	if (attributeType === UserAttributeType.pfp) {
		// null PFPs are allowed.
		if (!value) return true;
		
		// 2048 is generally the agreed maximum length a URL should be.
		if (value.length > 2048) return false;

		// No format check is required as a PFP URL is generated automatically by a
		// service.
		return true;
	}

	// Throw error if password type is passed.
	if (attributeType === UserAttributeType.password) {
		throw new Error('The password type cannot be checked.');
	}

	
	// TypeScript doesn't seem to recognise that there isn't a scenario that will mean
	// we get this far down. All variants of attribute types have a check associated.

	// Something has gone VERY wrong if we are at this point so throw an error.
	throw Error('Unknown attribute type passed.', {
		cause: {
			checkValue: value,
			attribute: attributeType,
		}
	});
}

export default checkAttributeConstraint;