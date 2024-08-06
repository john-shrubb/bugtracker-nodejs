import BugtrackCore from '../../../index.js';

function memberHasPermission(
	memberID : string,
	permissionInt : number,
	bgCore : BugtrackCore,
) : boolean {
	if (!bgCore.roleInventory.invReady) {
		throw new Error('The role inventory must be ready before checking permissions.');
	}

	const member = bgCore.projectMemberInventory.getMemberByID(memberID);

	if (!member) {
		throw new Error('Attempting to check permissions for non existent member.', {
			cause: {
				memberID: memberID,
			},
		});
	}

	if (!member.role) return false;

	if (member.role.permissionInt & permissionInt) return true;
	else return false;
}

export default memberHasPermission;