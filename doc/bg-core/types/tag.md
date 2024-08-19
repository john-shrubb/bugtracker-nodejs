# Tag

Tag is a way of representing a tag which was assigned to a ticket.

## Attributes

### id : `string`

The ID used to reference the tag.

### name : `string`

The name of the tag which shows on tickets when it is assigned.

### project : `Project`

The project the tag is a part of.

### colour : `string`

A 6 digit hexadecimal representation of a colour which shows when the tag is assigned to a ticket.

## Methods

### getTicketsWithTag() : `Array<Ticket>`

_Prone to be restructured into an attribute which looks like `this.tickets : Array<Ticket>`._

Grabs all the tickets which have this tag assigned to it. Note that you will need to filter this to tickets that the user can also access if being used in the API to return tickets to the user.

## Relations

-   Related to [Project](./project.md) - Uses this type for the `project` attribute.
-   Related to [Ticket](./ticket.md) - Uses this type for the `getTicketsWithTag()` method.
