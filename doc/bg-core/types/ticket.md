Ticket
======

Ticket are the primary purpose of the bugtracker, being a way of representing a ticket which can have different tags on it and have comments underneath it.

## Attributes

### id : `string`

The ID used to reference the ticket.

### author : `ProjectMember`

The project member who opened the ticket.

### priority : `TicketPriority`

An enumerator for the ticket priority. Can represent either high, medium or low priorities. Should affect how far the ticket shows on the dashboard.

### status : `TicketStatus`

An enum representing the status of the ticket, can either be Open, WiP or Closed. Open tickets should be shown first, subsorted by priority, with WiP tickets being shown below and closed tickets being hidden unless specifically filtered for.

### tags : `Array<Tag>`

The tags which have been assigned to the ticket. Tickets can be searched by tag.

### assignedMembers : `Array<ProjectMember>`

The project members without sufficient permissions to view all tickets who have been assigned to the project.

The author of the ticket cannot also be assigned as all members have automatic permissions to view their own tickets.

While it's pointless, there's no point in throwing errors for project members who already have permissions being assigned to the ticket.

### title : `string`

The title of the ticket.

### description : `string`

The description of the ticket.

### attachments : `Array<string>`

The URLs of files attached to the ticket.

### comments : `Array<Comment>`

Comments made under the ticket.

The inventory should sort these by oldest first.

### opened : `Date`

The date on which the ticket was created/opened.

## Methods

Ticket does not currently have any methods.

## Relations

- Related to [ProjectMember](./projectMember.md) - Uses this type for the `author` and `assignedMembers` attributes.
- Related to [TicketPriority](../enums/ticketPriority.md) - Uses this type for the `priority` attribute.
- Related to [TicketStatus](../enums/ticketStatus.md) - Uses this type for the `status` attribute.
- Related to [Tag](./tag.md) - Uses this type for the `tags` attribute.
- Related to [Comment](./comment.md) - Uses this type for the `comments` attribute.