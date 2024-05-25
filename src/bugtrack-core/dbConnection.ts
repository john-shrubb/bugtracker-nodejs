import pg from 'pg';
import {hostname, port, password, database, username} from '../config/dbParameters.json';

const clientPool = new pg.Pool({
	host: hostname,
	port: port,
	password: password,
	database: database,
	user: username,
}).connect();
export default await clientPool;
