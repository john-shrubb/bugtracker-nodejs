/**
 * An enumeration
 */

enum PossibleEvents {
	comment = 'COMMENTUPDATEEVENT',
	project = 'PROJECTUPDATEEVENT',
	projectmember = 'PROJECTMEMBERUPDATEEVENT',
	roleAssignment = 'ROLEASSIGNMENTUPDATEEVENT',
	role = 'ROLEUPDATEEVENT',
	session = 'SESSIONUPDATEEVENT',
	tag = 'TAGUPDATEEVENT',
	ticket = 'TICKETUPDATEEVENT',
	user = 'USERUPDATEEVENT',
}

export default PossibleEvents;