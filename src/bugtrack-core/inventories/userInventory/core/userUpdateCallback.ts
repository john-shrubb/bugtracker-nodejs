import BugtrackCore from '../../../index.js';
import User from '../../../types/user.js';

async function userUpdateCallback(
	userID : string,
	bgCore : BugtrackCore,
	userMap : Map<string, User>
) {
	const user = await bgCore.userInventory.noCacheGetUserByID(userID);

	if (!user) {
		userMap.delete(userID);
		return;
	}

	userMap.set(userID, user);
}

export default userUpdateCallback;