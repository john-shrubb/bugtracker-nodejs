Permissions
===========

Permissions are allocated to project members when the project owner (Or another project member with the appropriate permission) allocates a role to that user.

## Role

Roles are assigned to a user to distinguish themselves in a project and to grant them permissions to carry out administrative tasks within a project, such as allocating tickets to users, managing the project itself, and inviting/adding users to the project.

## Permissions & Bit Structure

Permissions in the system are represented via a bit structure, shown in the table below:

| Permission Name                 | Description                                              | Integer Representation | Binary Representation |
| :------------------------------ | :------------------------------------------------------- | :--------------------- | :-------------------- |
| View Tickets                    | User can view tickets without assignments                | 1                      | 0000000001            |
| Create Tickets                  | User can create their own tickets                        | 2                      | 0000000010            |
| Comment on ticket               | User can comment on other tickets                        | 4                      | 0000000100            |
| Set priority & status of ticket | User is able to set priority and status of other tickets | 8                      | 0000001000            |
| Assign users to tickets         | User can assign other users to tickets                   | 16                     | 0000010000            |
| Manage tickets                  | User is able to delete other tickets and comments        | 32                     | 0000100000            |
| Invite user to project          | User is able to invite other users to the project        | 64                     | 0001000000            |
| Remove member from project      | User can remove (Kick) other project members             | 128                    | 0010000000            |
| Grant roles to user             | User can grant roles to another project member           | 256                    | 0100000000            |
| Administrator                   | User has all above permissions and cannot be removed     | 512                    | 1000000000            |

*Notes:*
- The user is always able to set the status of their own ticket between *Open*, *WiP* and *Closed*.
- **IMPORTANT:** The administrator permission is a dangerous privilege to grant and should only be granted when necessary and only to trusted members of the project.