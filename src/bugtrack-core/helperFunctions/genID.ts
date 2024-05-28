import { randomInt } from 'crypto';

/**
 * Generate a valid ID which can be used. Is generated in a cryptographically secure
 * manner.
 * @returns A 15 digit ID.
 */
function generateID() : string {
	const generated : Array<number> = [];

	for (let x = 0; x < 15; x++) {
		generated.push(randomInt(0, 10));
	}

	return generated.join('');
}

export default generateID;