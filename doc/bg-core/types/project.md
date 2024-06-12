Project
=======

The project class represents a project within bg-core. It is an umbrella for project members, tickets (Comments are pulled from the ticket class), roles and tags.

## Attributes

### id : `string`

The ID used to reference the project.

### name : `string`

The name/title of the project.

### owner : `string`

The ID of the user who owns the project.

### tickets : `Map<string, Ticket>`

A map of the tickets, `string` in the map structure represents the ID of the ticket it corresponds to.

### projectMembers : `Map<string, ProjectMember>`

A map consisting of all the members of the project. Like in tickets, `string` corresponds to the ID of the project member.

### creationDate : `Date`

The date of project creation.

## Methods

Project does not currently have any methods.

## Relations

- Related to [Ticket](./ticket.md) - Uses this type for the `tickets` attribute.
- Related to [ProjectMember](./projectMember.md) - Uses this type for the `projectMembers` attribute.