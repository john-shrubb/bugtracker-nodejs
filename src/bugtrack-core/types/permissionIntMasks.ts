/**
 * The permission integer masks brought together to allow for easy reference without
 * memorising all the numbers.
 */
const PermissionIntMasks = {
	VIEW_TICKETS: 1,
	CREATE_TICKETS: 2,
	COMMENT_ON_TICKET: 4,
	SET_PRIORITY_AND_STATUS_OF_TICKET: 8,
	ASSIGN_USERS_TO_TICKETS: 16,
	MANAGE_TICKETS: 32,
	INVITE_USER_TO_PROJECT: 64,
	REMOVE_MEMBER_FROM_PROJECT: 128,
	GRANT_ROLES_TO_USER: 256,
	ADMINISTRATOR: 512
};

export default PermissionIntMasks;