The Database
============

This app uses PostgreSQL 16 for the database although there is the possibility on the DAL layer to implement a driver based architecture to allow for connections to multiple different types of databases.

Be aware, the system **will** break if you attempt to run multiple instances of bugtracker on the same database. There is currently no support for listening for changes to the database and updating cache (Future project?).

## Setup

*When the project has matured, this is due to be merged into a central setup.md file*

Use the provided [database creation script](../src/config/dbInitScript.sql) provided to create all the required tables. You can then use the below SQL, replacing `password123` with your own passwords to create two PostgreSQL roles to access the database with AND create a view used by the general purpose role to access the users table. I plan to automate this in a setup script at some point in the future.

```sql
-- Ensure you are executing this script in the context of the correct database!

CREATE ROLE bugtrackernodejsusermanager LOGIN ENCRYPTED PASSWORD 'password123';
CREATE ROLE bugtrackernodejsgeneralpurpose LOGIN ENCRYPTED PASSWORD 'password123';

-- Allow bugtracker-user-manager to see and edit users table. Role should not have permissions for anything else.

GRANT ALL ON users, sessions, loginattempts TO bugtrackernodejsusermanager;

-- Role cannot edit users table nor see passwords or soft deleted accounts.

GRANT SELECT, UPDATE ON usersgp TO bugtrackernodejsgeneralpurpose;

-- Does have permissions for everything else.

GRANT SELECT, INSERT, UPDATE, DELETE ON projects, projectmembers, tickets, ticketassignments, comments, contentedits, tags, tagassignments, roles, roleassignments TO bugtrackernodejsgeneralpurpose;
```

## Roles

For security, there are currently two roles which can access the database. Neither should own the database to keep tight data security.

### User manager

There is a user manager role which can access the user table in it's entirety to be able to access hashed and salted password and other details to create and delete users.

### General purpose

This user can access every other table, however it must access `users` with the `usersreduced` view which disallows it from viewing any password data for the users table.

## TBC

Will be further expanded as time goes on.