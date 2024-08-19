# UserInventory

Looking to authenticate a user or validate sessions? [Check out UserManagerInventory.md](./userManagerInventory.md).

UserInventory provides a quick and seecure means to read and update user data. User inventory can fetch and update all data (Excluding IDs) found in the [User class](../types/user.md). It does not handle anything relating to authentication or passwords, however, this is handled by UserManagerInventory (See above link).

Due to the cache UserInventory maintains, most methods it provides for fetching user data are synchronous, meaning you do not need to use the `await` keyword when fetching data. However, if you are updating user data and then need to get the user object again, it is recommended to use `noCacheGetUserByID()` as this will pull user details directly from the database.

## Attributes

These attributes are private to prevent cache from accidentally being broken or invalidated by another class.

### userMap : `Map<string, User>`

The cache which holds all the users. `string` in the map represents the user's ID.

### gpPool : `PoolClient`

The connection to the database used to grab user details and update them.

## Methods

### getUserByID(userID : string) : `User | null`

Attempt's to retrieve a user by their ID from cache and returns if found.

Returns null if no user is found.

### getUserByEmail(userEmail : string) : `User | null`

Grabs a user by their email and returns them if found.

Due to the structure of the cache, attempting to retrieve a user by their email is not recommended as it may eat up more CPU time.

Returns null if no user is found.

### getUserByUsername(username : string) : `User | null`

Pulls a user from cache from their username.

This encounters the same issue as the above method in that the operation is not as CPU efficient as `getUserByID()`.

Returns null if no user is found.

### noCacheGetUserByID(userID : string) : `Promise<User | null>`

The same as `getUserByID()` but queries the database instead of the cache.

Recommended for if you have just created a user or updated a user to get the most up to date version of the User object.

**Significantly less efficient than `getUserByID()`.**

Returns null if no user is found.

### queryUserIdentifier(identifier : string) : `User | null`

Quick way to attempt to grab a user, queries cache as if the identifier were an ID, username and email and returns a user if one was found through any of the identifiers.

### updateUser(user : User, updateType : UserAttributeType, newValue : string) : `void`

Update an attribute about a user, an error will be thrown if the `newValue` argument does not pass a format check for the attribute being updated.
An error will also be thrown if `updateType` is passed as password, please see [UserManagerInventory](./userManagerInventory.md) for password management.
