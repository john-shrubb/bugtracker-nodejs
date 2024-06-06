/**
 * The UserUpdateType enum indicates the type of update being made to a user.
 */

enum UserAttributeType {
	// Regular user attribute types.
	displayname = 'UPDATEDISPLAYNAME',
	email = 'UPDATEEMAIL',
	username = 'UPDATEUSERNAME',
	pfp = 'UPDATEPFP',

	// Password is a protected attribute type which cannot be accessed outside of
	// UserManagerInventory.

	password = 'UPDATEPASSWORD',
}

export default UserAttributeType;