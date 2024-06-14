TicketStatus
============

TicketStatus is a way of representing the current status of a ticket. It can be open, WiP or closed.

## Attributes

### `TicketStatus.open`

This attribute represents the fact that a ticket is open. This means comments can be made to it and it will show up at the top of the list of tickets.

### `TicketStatus.wip`

This represents a ticket being a work in progress. Tickets won't show up as high as open tickets but will still be shown.

### `TicketStatus.closed`

This represents a ticket being closed. A closed ticket will not show up unless filtered for and cannot have any comments added to it unless it is reopened.