/**
 * Checks the length and whether an ID consists of entirely digits.
 * @param id The ID to check the format of.
 * @returns True if the ID is valid, false if it isn't.
 */

function checkID(id : string) : boolean {
	// Length check the ID. Is instantly invalid if it isn't 15 letters in length.
	if (id.length !== 15) {
		return false;
	}

	// Since I don't understand ReExp, I'm just defining an array of valid digits the ID
	// can be.
	const validDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

	// A boolean which is false until an invalid digit is detected within the ID.
	let IDInvalidated = false;

	// TODO: At some point when everything is working, refactor this into a traditional
	//       for loop which can be broken out of to save CPU instruction cycles.
	// For each digit in the ID...
	id.split('').forEach((value) => {
		// Does the ID not include a valid digit?
		if (!validDigits.includes(value)) {
			// Then mark the ID as invalid.
			IDInvalidated = true;
			return;
		}
	});

	// IDInvalidated is false if the ID is valid, therefore it needs to be flipped.
	return !IDInvalidated;
}

export default checkID;