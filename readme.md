Simple Bugtracker
=================

This is a simple bug tracker written using node.js, it uses Express for web serving and PostgreSQL for data storage.

## Setup

This project was developed on node.js v18.19.0 (Straight from the Debian repo at the time of writing) and PostgreSQL 15.6. Run `npm install` to install all required packages and `npm run start` to start the project with everything loaded.

### Environment Variables

BugtrackCore uses a number of environment variables to connect to the databse, shown below:
- PORT - The port PostgreSQL is running on.
- HOSTNAME - The IP address/host to attempt to reach a PostgreSQL instance on.
- DBNAME - The name of the database to connect to.
- LOGIN - The username of the PostgreSQL user to log in as.
- PASSWORD - The user's password.
Make sure to make these environment variables accessible to the node.js process.
`TODO - Create a setup script which will create these environment variables.`

## TBC

This readme.md will be expanded upon as the project progresses.

## Licensing

The entirety of this project and all previous, future and current versions are licensed under the [GNU General Public License v3.0](https://www.gnu.org/licenses/gpl-3.0.html).