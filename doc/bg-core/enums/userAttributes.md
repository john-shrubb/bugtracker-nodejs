# UserAttributeType

UserAttributeType is a standard way of representing an attribute of a user, primarily used to differentiate between multiple different attributes of a user with the same data type, such as `email` and `username`.

## Attributes

### `UserAttributeType.displayname`

This represents the displayname of a user.

[User.displayname](../types/user.md#displayname--string)

### `UserAttributeType.email`

Represents a user email.

[User.email](../types/user.md#email--string)

### `UserAttributeType.username`

Represents a user's username.

[User.username](../types/user.md#username--string)

### `UserAttributeType.pfp`

Represents the user's profile picture.

[User.pfp](../types/user.md#pfp--string)

### `UserAttributeType.password`

Represents the user's password. Be careful in what context you use this as many functions outside of the UserInventory do not support CRUD operations for this attribute and will likely raise errors.
