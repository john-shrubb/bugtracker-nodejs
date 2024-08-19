import BugtrackCore from '../../../index.js';
import Role from '../../../types/role.js';

async function roleUpdateCallback(
	roleID: string,
	bgCore: BugtrackCore,
	roleMap: Map<string, Role>,
) {
	const role = await bgCore.roleInventory.noCacheGetRoleByID(roleID);

	if (!role) {
		roleMap.delete(roleID);
		return;
	}

	roleMap.set(roleID, role);
}

export default roleUpdateCallback;
