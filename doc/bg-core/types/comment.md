# Comment

The comment class is used to represent a comment made under a ticket.

## Attributes

### id : `string`

The ID used to reference the comment.

### author : `ProjectMember`

The author of the project represented as a `ProjectMember`.

### content : `string`

The content of the comment.

### ticket : `Ticket`

The ticket the comment was made under.

### createdOn : `Date`

The date the comment was made on.

## Methods

Comment does not currently have any methods.

## Relations

-   Related to [ProjectMember](./projectMember.md) - Uses this type for the `author` attribute.
-   Related to [Ticket](./ticket.md) - Uses this type for the `ticket` attribute.
