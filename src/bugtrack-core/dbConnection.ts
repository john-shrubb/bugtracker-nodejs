import pg from 'pg';

// Pull in some environment variables

const config = {
	host: process.env['HOST'],
	port: Number(process.env['PORT']),
	database: process.env['DBNAME'],
};

// User Manager Pool.
// Connects with the user manager role which can access passwords, salts, sessions and
// login attempts.

const umPool = await new pg.Pool({
	host: config.host,
	port: config.port,
	database: config.database,
	user: process.env['UM-LOGIN'],
	password: process.env['UM-PASSWORD'],
}).connect();

// General Purpose Pool.
// Connects with the general purpose role which can access all other tables with limited
// access to the users table (Passwords and salts omitted).

const gpPool = await new pg.Pool({
	host: config.host,
	port: config.port,
	database: config.database,
	user: process.env['GP-LOGIN'],
	password: process.env['GP-PASSWORD'],
}).connect();

export { umPool, gpPool };
