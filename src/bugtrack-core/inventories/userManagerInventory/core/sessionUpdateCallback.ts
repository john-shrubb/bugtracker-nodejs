import Session from '../../../types/session.js';
import { QueryResult } from 'pg';
import { umPool } from '../../../dbConnection.js';
import BugtrackCore from '../../../index.js';
import bcrypt from 'bcrypt';

/**
 * Structure for the session rows when they are fetched from the database.
 */
interface sessionRowStructure {
	sessiontoken : string;
	userid       : string;
	useragent    : string;
	issuedon     : Date;
	expireson    : Date;
	sessionid    : string;
}

async function sessionUpdateCallback(
	sessionID : string,
	bgCore : BugtrackCore,
	sessionMap : Map<string, Session>,
) {
	// Grab raw query result from PostgreSQL.
	const sessionDataRaw : QueryResult<sessionRowStructure> =
		await umPool.query('SELECT * FROM sessions WHERE sessionid=$1;', [sessionID]);

	// If the database no longer shows a session then delete it from cache.
	if (!sessionDataRaw.rows.length) {
		sessionMap.delete(sessionID);
		return;
	}

	// Get the session data object.

	const sessionData = sessionDataRaw.rows[0];

	const session = new Session(
		bgCore,
		sessionData.sessionid,
		await bcrypt.hash(sessionData.sessiontoken, 10),
		sessionData.useragent,
		bgCore.userInventory.getUserByID(sessionData.userid)!,
		sessionData.issuedon,
		sessionData.expireson,
		bgCore.userManagerInventory.deleteSession,
	);

	// Assign the session a spot in cache.
	sessionMap.set(sessionID, session);
}

export default sessionUpdateCallback;