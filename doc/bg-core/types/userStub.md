# UserStub

UserStub is used to represent a deleted user which has been somewhat anonymised and can still be displayed as the author of a ticket/comment.

A UserStub type can be accessed via the `UserManagerInventory` which has access to deleted users.

Deleted users should not by default be displayed in member lists and should only be used when the author of a comment/ticket is being loaded.

## Attributes

### id : `string`

The ID used to reference the user stub.

### displayName : `string`

The name displayed to other users.

### username : `string`

The username other users can use to identify the user stub. Shouldn't really be too useful but is still mandatory by the database.

### email : `string`

The email assigned to the user stub.

## Methods

UserStub does not currently have any methods.
