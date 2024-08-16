Simple Bugtracker
=================

This is a simple bug tracker written using node.js, it uses Express for web serving and PostgreSQL for data storage.

*Setup steps will be gradually improved over time.*

## Documentation

See [the documentation folder](./doc/readme.md) to review how it all works.

## Setup

Current setup instructions are as follows:

1. Run `npm update` in the root project directory to install all of the required packages.
2. Create a `.env` file in the root directory with the content shown below, replacing the values as described.
```ini
# Replace with your PostgreSQL instance details.
HOST=localhost
PORT=5432
DBNAME=troubletrackerdb

# The details for the user manager role.
UM-LOGIN=your_user_manager_role
UM-PASSWORD=user_manager_role_pass_123

# The details for the general purpose role.
GP-LOGIN=your_general_purpose_role
GP-PASSWORD=general_purpose_role_pass_123
```
<!--
	TODO: Add a script to automatically perform this step.
-->
3. Run `npm run start` to start the service.

## Licensing

The entirety of this project and all previous, future and current versions are licensed under the [GNU General Public License v3.0](https://www.gnu.org/licenses/gpl-3.0.html).