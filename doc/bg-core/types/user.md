User
====

The user class makes up the bread and butter of everything that happens in bg-core. It represents a user in a general context.

## Attributes

### id : `String`

A string used to reference the user.

### username : `String`

A username unique to that user which can also be used to refer to them on the front end.

### email : `String`

The user's email address.

### displayName : `String`

The name shown to other users.

### pfp : `String`

A url which the browser client can call to get the user's profile picture. Will default to a stock photo if it is null.

### creationDate : `Date`

The date of account creation.

## Methods

### getProjects() : `Array<ProjectMember>`

*Prone to be restructured into a attribute which looks something like `this.projects : Array<Project>`*

Fetches all the projects the user is a member of and returns these projects in the form of a `ProjectMember`.

## Relations

- Related to [ProjectMember](./projectMember.md) - Uses this type for the `getProjects()` method.
