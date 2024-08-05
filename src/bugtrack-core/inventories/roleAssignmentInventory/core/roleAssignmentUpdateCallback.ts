import { gpPool } from '../../../dbConnection.js';
import BugtrackCore from '../../../index.js';
import Role from '../../../types/role.js';

async function roleAssignmentUpdateCallback(
	roleID: string,
	memberID: string,
	bgCore : BugtrackCore,
	roleAssignmentMap: Map<string, Role>,
) {
	// Get the role object.
	const role = await bgCore.roleInventory.getRoleByID(roleID);

	// The member cannot have the role if it no longer exists.
	if (!role) {
		roleAssignmentMap.delete(memberID);
		// Set removed to true in the DB.
		await gpPool.query(
			'UPDATE roleassignments SET removed = $1 WHERE memberid = $2;',
			[true, memberID]
		);
		return;
	}

	// Get the member object to ensure that they exist.
	const member = await bgCore.projectMemberInventory.noCacheGetMemberByID(roleID);

	// If they don't exist, they clearly don't have the role anymore.
	if (!member) {
		roleAssignmentMap.delete(memberID);
		// Set removed to true in the DB.
		await gpPool.query(
			'UPDATE roleassignments SET removed = $1 WHERE memberid = $2;',
			[true, memberID]
		);
		return;
	}

	// Finally, assign the role to the assignment map if everything checks out.
	roleAssignmentMap.set(memberID, role);
}

export default roleAssignmentUpdateCallback;