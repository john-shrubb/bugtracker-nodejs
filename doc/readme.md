Documentation
=============
Documentation will be expanded as development goes on.

As of right now, the planned structure of this bugtracker is to seperate it into three main components to allow for modularity:

- Bugtracker Core: The core layer of the bugtracker which handles interactions with the database in a secure way. Provides types to represent data and a class instance.
- Bugtracker API: The API layer which faces towards browsers and other clients to interact with bugtrack core.
- Bugtracker Web: The user interface which can be used by normal users to interact with the API. Essentially functions like a web app.

This modularity allows for users to either deploy the full bugtracker suite, run a headless API without Bugtracker Web, or extend Bugtracker Core in their own way.

## Table of Contents

- [Permissions](./permissions.md)
- [Database](./database.md)
- [Bugtracker Core](./bg-core.md)
