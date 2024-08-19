# Role

Role is used to represent a project member's role within the project. It handles the permissions the user has, can signify their role within a project with `displayTag`, and can even have a colour.

## Attributes

### id : `string`

The ID used to reference the role.

### name : `string`

The display name for the role that is shown to other users.

### permissionBits : `int`

The integer representing the permissions the user has. Permissions are calculated based on the binary representation of that integer. See [permissions.md](../permissions.md) for details.

### colour : `string`

A 6 digit string representing a hexadecimal code, for example `e8e8e8`.

### displayTag : `boolean`

Whether the tag should be displayed to other users next to their name.

## Methods

### getUsersWithRole() : `Array<ProjectMember>`

Grabs all users who have the role and returns them as `ProjectMember`.

## Relations

-   Related to [ProjectMember](./projectMember.md) - Uses this type for the `getUsersWithRole()` method.
