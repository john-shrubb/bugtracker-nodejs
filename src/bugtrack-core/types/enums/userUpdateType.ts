/**
 * The UserUpdateType enum indicates the type of update being made to a user.
 */

enum UserUpdateType {
	// Regular user update types.
	displayname = 'UPDATEDISPLAYNAME',
	email = 'UPDATEEMAIL',
	username = 'UPDATEUSERNAME',
	pfp = 'UPDATEPFP',

	// Password is a protected update type which must be used in the userManagerInventory

	password = 'UPDATEPASSWORD',
}

export default UserUpdateType;