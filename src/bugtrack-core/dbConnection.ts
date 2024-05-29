import pg from 'pg';

const config = {
	host: process.env['HOST'],
	port: Number(process.env['PORT']),
	database: process.env['DBNAME'],
};

const umPool = await new pg.Pool({
	host: config.host,
	port: config.port,
	database: config.database,
	user: process.env['UM-LOGIN'],
	password: process.env['UM-PASSWORD'],
}).connect();

const gpPool = await new pg.Pool({
	host: config.host,
	port: config.port,
	database: config.database,
	user: process.env['GP-LOGIN'],
	password: process.env['GP-PASSWORD'],
}).connect();

export default { umPool, gpPool };
