import Role from '../../../types/role.js';

function getRolesByProjectID(
	projectID : string,
	roleMap : Map<string, Role>,
) : Role[] {
	const rolesArray = Array.from(roleMap.values());

	const filteredRoles = rolesArray.filter(role => role.parentProject.id === projectID);

	return filteredRoles;
}

export default getRolesByProjectID;