# ProjectMember

The ProjectMember type is a way of representing a user in the context of being a member in a project.

## Attributes

### memberID : `string`

The ID used to reference the project member

### user : `User`

The user whom the project member is linked to.

### project : `Project`

The project the user is a member of.

### role : `Role`

The role assigned to the user.

### joined : `Date`

The date at which the user joined the project.

## Methods

### getTickets() : `Array<Ticket>`

Fetches all tickets created by the user and returns them in the form of an array.

### getComments() : `Array<Comment>`

Gets all the comments the user has made on a project.

## Relations

-   Related to [Ticket](./ticket.md) - Uses this type for the `getTickets()` method.
-   Related to [Comment](./comment.md) - Uses this type for the `getComments()` method.
