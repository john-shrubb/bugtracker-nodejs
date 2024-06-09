Bugtrack Core
=============

Bugtrack Core is a library provided to provide an easy, fast and secure layer to interact with the database. It provides types to represent data within the library, and a bugtracker-core instance which can handle interactions with the database.

Bugtrack Core may be abbreviated as or some variation of bg-core.

## Table of Contents
This table of contents provides easy access to the documentation relating to bg-core.

- [Database](./database.md)
- [Permissions](./permissions.md)
- Types
	- [Comment]()
	- [LoginAttempt]()
	- [Project]()
	- [ProjectMember]()
	- [Role]()
	- [Session]()
	- [Tag]()
	- [Ticket]()
	- [User]()
- Enumeration Types
	- [Ticket Priority]()
	- [Ticket Status]()
	- [User Attributes]()
- Interfaces
	- **A minor refactor is required before interfaces are documented.**

## Types

Bugtrack Core provides several types which are used to represent up to date information.
Each class will usually have a private instance of bg-node to allow the class to provide methods such as getProjects() which require the class to pull data from an inventory. To avoid repitition, unless otherwise stated in the class, this attribute, usually accessed by `<object>.bgNode` will not be referenced.