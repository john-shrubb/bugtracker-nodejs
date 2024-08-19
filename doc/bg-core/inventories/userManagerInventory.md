# UserManagerInventory

This inventory is responsible for all authentication and user management (Excluding non protected user attributes such as their profile picture, see [userInventory](./userInventory.md)).

## Attributes

These attributes are private to prevent cache from accidentally being broken or invalidated by another class.

### umPool : `PoolClient`

An instance of the pool client with access to the full users table, the sessions table, and the login attempts table. Is supposed to be used for enhanced user administration utilities.

### bgCore : `BugtrackCore`

The main instance of bg-core.

### sessionMap : `Map<string, Session>`

The cache used to hold all sessions. The session fields are hashed to prevent an attack where an attacker is able to get ahold of this map somehow.

## Methods

### checkToken(sessionToken : string) : `Promise<User | null>`

Check a session token to see if it correlates to a user.

### deleteSession(session : Session) : `Promise<void>`

Deletes a session, generally used as a callback function for expired sessions to call, or for when a user logs out.

### authenticateUser(user : User, password : string, userAgent : string, ipAddress : string) : `Promise<string | error>`

Attempt to authenticate a user, requires an IP address and user agent to be passed for insertion into the login attempts table.
Will return either a valid session token or an error (Not thrown) if there is an issue with authentication.

### createUser(username : string, email : string, displayname : string, pfp : string, password : string) : `Promise<string>`

Creates a user with the attributes specified and returns their new allocated ID.
When using this function, if you need to immediately get the user type from `userInventory`, use the `noCacheGetUserByID()` function rather than `getUserByID()` as the cache may take a few seconds to update to reflect the new user.

### deleteUser(user : User) : `Promise<void>`

Deletes a user from the system. Will throw an error if the specified user does not exist.
Note that users are never entirely removed. They are only marked as deleted and as such no longer accessible.

### updatePassword(user : User, oldPassword : string, newPassword : string) : `Promise<void>`

Updates the password of a user. Requires their old password to set a new one at the inventory level for security reasons.
Will throw an error if the oldPassword is incorrect.
