import pg from 'pg';

const clientPool = new pg.Pool({
	host: process.env.HOST,
	port: Number(process.env.PORT),
	password: process.env.PASSWORD,
	database: process.env.DBNAME,
	user: process.env.LOGIN,
}).connect();
export default await clientPool;
