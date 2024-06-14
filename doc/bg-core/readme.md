Bugtrack Core
=============

Bugtrack Core is a library provided to provide an easy, fast and secure layer to interact with the database. It provides types to represent data within the library, and a bugtracker-core instance which can handle interactions with the database.

Bugtrack Core may be abbreviated as or some variation of bg-core.

*Due to the immature nature of bg-node, the interfaces provided by inventories/types/services may change and return different data or otherwise break code written over it.*

## Table of Contents
This table of contents provides easy access to the documentation relating to bg-core.

- [Database](./database.md)
- [Permissions](./permissions.md)
- Types
	- [Comment](./types/comment.md)
	- [LoginAttempt](./types/loginAttempt.md)
	- [Project](./types/project.md)
	- [ProjectMember](./types/projectMember.md)
	- [Role](./types/role.md)
	- [Session](./types/session.md)
	- [Tag](./types/tag.md)
	- [Ticket](./types/ticket.md)
	- [User](./types/user.md)
- Enumeration Types
	- [PossibleEvents](./enums/possibleEvents.md)
	- [TicketPriority](./enums/ticketPriority.md)
	- [TicketStatus](./enums/ticketStatus.md)
	- [UserAttributeType](./enums/userAttributes.md)

## Types

Bugtrack Core provides several types which are used to represent up to date information.

Each class will usually have a private instance of bg-core to allow the class to provide methods such as getProjects() which require the class to pull data from an inventory. To avoid repitition, unless otherwise stated in the class, this attribute, usually accessed by `<object>.bgCore` will not be referenced.

## Inventories

Inventories are classes that sit between the database and the rest of the system. They expose methods to other functions to allow easy interactions with the database to perform CRUD operations. These inventories are usually referenced through `<BugtrackCore>.inventory` and are all automatically initialised upon creation of the BugtrackCore instance.

### Cache

Each inventory maintains its own cache of the objects it provides CRUD operations for. Upon initialisation, the inventory will pull all records from the database and build these into a cache which is very simple and quick to access if you know a user's ID.

Accessing the database and updating/inserting records outside of the inventories is very unrecommended as this may cause sections of the cache to become invalid if the database is not notified. bg-core has a way of dealing with this through the use of the cache invalidation notification service, which allows inventories to notify the service when there is a change to a record, such as a new user being inserted. The inventories will receive this notification and update the cache themselves.

## Planned Additions

My current list of planned additions is as follows after the first iteration of bg-core is complete (In no particular order):
- Writing unit tests to ensure bg-node's inventories can perform CRUD operations correctly.
- A "ready" system which each inventory will connect to and inform after cache building has finished. The idea is the API and front end do not start serving until the app has finished building it's cache.
- More granular cache invalidation where the system will indicate the specific field which was updated or action which was performed to avoid entire object rebuilds to occur.
- More comprehensive documentation.
- To allow for the instance to be deployed as a decentralised publicly available system or as a more tightly controlled system where it is invitation only (An email invitation can be sent to allow the user to sign up), perfect as an addition to a company intranet.
- Capability for some kind of announcements tab where an overall system administrator can write posts.
- Potentially more robust types which when connected to an instance of bg-core can automatically update their own attributes. Would require a major restructuring of the classes to make for more use of private variables coupled with getters to prevent another class from polluting the type. Would also remove the need for deep copying a variable and make variables much more simple to construct if I introduce the concept of `<object>.from(objectID)` which will handle all the construction and initialisation.
- For databases that support it, implement a listen function to automatically update cache records if edits are made to the database.
