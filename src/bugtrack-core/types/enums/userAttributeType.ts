/**
 * The UserUpdateType enum provides a standard way to indicate the attribute of a user
 * being referred to.
 */

enum UserAttributeType {
	// Regular user attribute types.
	displayname = 'DISPLAYNAMEATTRIBUTE',
	email = 'ATTRIBUTEEMAIL',
	username = 'USERNAMEATTRIBUTE',
	pfp = 'PFPATTRIBUTE',

	// Password is a protected attribute type which cannot be accessed outside of
	// UserManagerInventory.

	password = 'PASSWORDATTRIBUTEPROTECTED',
}

export default UserAttributeType;