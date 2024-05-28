-- Initialise a database to work with the bug tracker system.
-- Does NOT check for already existing tables and the integrity of them.

-----------------
-- Users Table --
-----------------
-- Holds current and deleted users.
-- If a user is deleted, then their userid, username and display name are kept, with all other details being nulled.

CREATE TABLE IF NOT EXISTS users (
	userid char(15) PRIMARY KEY,
	username varchar(30) NOT NULL,
	email varchar(256),
	displayname varchar(50) NOT NULL,
	pfp text,
	pass text, -- WILL BE HASHED
	salt char(256),
	deleted boolean DEFAULT 'false',
	creationdate timestamp NOT NULL DEFAULT now(),

	-- Check to ensure that deleted accounts are allowed to have null fields.
	CHECK ((email IS NOT NULL AND pfp IS NOT NULL AND pass IS NOT NULL AND salt IS NOT NULL) OR deleted = 'true')
);

CREATE VIEW usersgp AS SELECT userid, username, email, displayname, pfp, creationdate FROM users WHERE deleted='false';

--------------------
-- Projects Table --
--------------------
-- Created projects are kept here.

CREATE TABLE IF NOT EXISTS projects (
	projectid char(15) PRIMARY KEY,
	displayname varchar(60) NOT NULL,
	ownerid char(15),
	creationdate timestamp DEFAULT now(),

	FOREIGN KEY (ownerid) REFERENCES users(userid) ON UPDATE CASCADE
);


---------------------------
-- Project Members Table --
---------------------------
-- Records are kept of when a user has joined a project here.

CREATE TABLE IF NOT EXISTS projectmembers (
	memberid char(15) PRIMARY KEY, -- A seperate memberid allows role assignments to be easily dropped when the user leaves a project.
	userid char(15) NOT NULL,
	projectid char(15) NOT NULL,
	joindate timestamp DEFAULT now(),

	FOREIGN KEY (userid) REFERENCES users(userid) ON UPDATE CASCADE ON DELETE CASCADE,
	FOREIGN KEY (projectid) REFERENCES projects(projectid) ON UPDATE CASCADE ON DELETE CASCADE
);


-------------------
-- Tickets Table --
-------------------
-- Tickets are kept in this table.

-- Enumeration Types --

CREATE TYPE priority AS ENUM ('Low', 'Medium', 'High');
CREATE TYPE status AS ENUM ('Closed', 'WiP', 'Open');

CREATE TABLE IF NOT EXISTS tickets (
	ticketid char(15) PRIMARY KEY,
	authorid char(15) NOT NULL,
	projectid char(15),
	title varchar(100),
	description text,
	currentstatus status,
	ticketpriority priority,
	attachments text[],
	deleted boolean, -- Anti-abuse would require that the ticket when deleted is simply hidden.
	creationdate timestamp DEFAULT now(),

	FOREIGN KEY (authorid) REFERENCES users(userid) ON UPDATE CASCADE ON DELETE NO ACTION,
	FOREIGN KEY (projectid) REFERENCES projects(projectid) ON UPDATE CASCADE ON DELETE SET NULL
);


------------------------------
-- Ticket Assignments Table --
------------------------------
-- Holds records of users which have been assigned on to tickets.

CREATE TABLE IF NOT EXISTS ticketassignments (
	ticketid char(15) NOT NULL,
	userid char(15) NOT NULL,
	assignedby char(15) NOT NULL,
	assignedon timestamp NOT NULL DEFAULT NOW(),

	-- Ensure the server side is not attempting to say a user is assigning themselves to a ticket.
	CHECK (NOT userid = assignedby),

	FOREIGN KEY (ticketid) REFERENCES tickets(ticketid) ON UPDATE CASCADE ON DELETE CASCADE,
	FOREIGN KEY (userid) REFERENCES users(userid) ON UPDATE CASCADE ON DELETE NO ACTION,
	FOREIGN KEY (assignedby) REFERENCES users(userid) ON UPDATE CASCADE ON DELETE NO ACTION
);


--------------------
-- Comments Table --
--------------------
-- Holds all comments made under tickets.

CREATE TABLE IF NOT EXISTS comments (
	commentid char(15) PRIMARY KEY,
	ticketid char(15) NOT NULL,
	authorid char(15) NOT NULL,
	content text NOT NULL,
	deleted boolean DEFAULT 'false',

	FOREIGN KEY (ticketid) REFERENCES tickets(ticketid) ON UPDATE CASCADE ON DELETE NO ACTION,
	FOREIGN KEY (authorid) REFERENCES users(userid) ON UPDATE CASCADE ON DELETE NO ACTION
);


------------------------
-- Content Edits Table --
------------------------
-- All edits are logged to prevent system abuse. If both a ticket title and description are edited these should be in two seperate entries.

-- Enumeration Types --

CREATE TYPE contentedittype AS ENUM ('title', 'description', 'comment');

CREATE TABLE IF NOT EXISTS contentedits (
	ticketid char(15) NOT NULL,
	commentid char(15),
	edittype contentedittype,
	oldcontent text,
	newcontent text,
	editdate timestamp DEFAULT now(),

	-- This check ensures that the commentid column cannot be filled if the content being edited is anything other than a comment.
	CHECK (commentid IS NULL OR edittype = 'comment'),

	FOREIGN KEY (ticketid) REFERENCES tickets(ticketid) ON UPDATE CASCADE ON DELETE SET NULL,
	FOREIGN KEY (commentid) REFERENCES comments(commentid) ON UPDATE CASCADE ON DELETE SET NULL
);


----------------
-- Tags Table --
----------------
-- Tags are used to differentiate tickets into different searchable categories.

CREATE TABLE IF NOT EXISTS tags (
	tagid char(15) PRIMARY KEY,
	tagname varchar(20),
	projectid char(15) NOT NULL,
	colour char(6) NOT NULL DEFAULT '343434', -- 6 digit hex representation of the tag colour that will be applied.

	FOREIGN KEY (projectid) REFERENCES projects(projectid) ON UPDATE CASCADE ON DELETE CASCADE
);


---------------------
-- Tag Assignments --
---------------------
-- Holds records of tag assignments to different tickets.

CREATE TABLE IF NOT EXISTS tagassignments (
	ticketid char(15) NOT NULL,
	tagid char(15) NOT NULL,
	assignedby char(15) NOT NULL,
	assignedon timestamp NOT NULL DEFAULT NOW(),

	FOREIGN KEY (ticketid) REFERENCES tickets(ticketid) ON UPDATE CASCADE ON DELETE CASCADE,
	FOREIGN KEY (tagid) REFERENCES tags(tagid) ON UPDATE CASCADE ON DELETE CASCADE,
	FOREIGN KEY (assignedby) REFERENCES users(userid) ON UPDATE CASCADE ON DELETE NO ACTION
);


-----------------
-- Roles Table --
-----------------
-- Roles are used to define people's purpose within a project and grant them permissions.

CREATE TABLE IF NOT EXISTS roles (
	roleid char(15) PRIMARY KEY,
	projectid char(15),
	rolename varchar(20) NOT NULL,
	displaytag boolean DEFAULT 'false',
	permissionmask int,
	deleted boolean DEFAULT 'false',

	FOREIGN KEY (projectid) REFERENCES projects(projectid) ON UPDATE CASCADE ON DELETE SET NULL
);


----------------------
-- Role Assignments --
----------------------
-- Roles that have been assigned to other project members.

CREATE TABLE IF NOT EXISTS roleassignments (
	roleid char(15) NOT NULL,
	memberid char(15),
	assignedby char(15) NOT NULL,
	assignedon timestamp NOT NULL DEFAULT NOW(),

	FOREIGN KEY (roleid) REFERENCES roles(roleid) ON UPDATE CASCADE ON DELETE NO ACTION,
	FOREIGN KEY (memberid) REFERENCES projectmembers(memberid) ON UPDATE CASCADE ON DELETE SET NULL
);

--------------------------
-- Login Attempts Table --
--------------------------
-- Holds all login attempts

CREATE TABLE IF NOT EXISTS loginattempts (
	userid char(15) NOT NULL,
	attemptdate timestamp NOT NULL DEFAULT NOW(),
	successful boolean NOT NULL,
	ipaddress varchar(39) NOT NULL,
	useragent varchar(512) NOT NULL,

	-- Minimum length of an IPv4 address is 8 characters (e.g 1.1.1.1).
	-- Maximum length of an IPv6 address is 39 characters, this is handled by the data type itself being variable between 0 and 39.

	CHECK(LENGTH(ipaddress) >= 8),

	FOREIGN KEY (userid) REFERENCES users(userid) ON UPDATE CASCADE ON DELETE NO ACTION
);

--------------------
-- Sessions Table --
--------------------
-- Holds all currently active sessions.

CREATE TABLE IF NOT EXISTS sessions (
	sessiontoken char(256) NOT NULL,
	userid char(15) NOT NULL,
	useragent varchar(512) NOT NULL,
	issuedon timestamp NOT NULL DEFAULT NOW(),
	expireson timestamp NOT NULL, -- Using SQL to calculate a default for the expires on creates a very complex statement. Handle this on the server side.

	FOREIGN KEY (userid) REFERENCES users(userid) ON UPDATE CASCADE ON DELETE CASCADE
);

-- This took way too long :(