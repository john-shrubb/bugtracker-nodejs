import { umPool } from '../../../dbConnection.js';
import BugtrackCore from '../../../index.js';
import { possibleEvents } from '../../../services/cacheInvalidationService.js';
import Session from '../../../types/session.js';

async function deleteSession(
	session: Session,
	bgCore: BugtrackCore,
	sessionMap: Map<string, Session>,
) {
	if (!sessionMap.has(session.id)) {
		throw new Error('Attempted to delete non existent session.', {
			// Construct a cause with a bunch of details.
			cause: {
				sessionID: session.id,
				sessionExpiry: session.expires.toISOString(),
				sessionIssue: session.issued.toISOString(),
				sessionUserID: session.user.id,
				sessionUserAgent: session.userAgent,
			},
		});
	}

	// Query the database to additionally remove the session from there.
	await umPool.query('DELETE FROM sessions WHERE sessionid=$1;', [session.id]);

	// If the session has been removed from the database, then the callback function
	// for updating sessions will deal with removing it from cache.
	// Removing the session from cache and notifying the event system of an update may
	// lead to issues where the sessionUpdateCallback is trying to find and remove non
	// existent sessions.

	bgCore.cacheInvalidation.notifyUpdate(possibleEvents.session, session.id);
}

export default deleteSession;
