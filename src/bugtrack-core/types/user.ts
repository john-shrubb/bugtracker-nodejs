import ProjectMember from './projectMember.js';

/**
 * A class used to represent users within the bug tracker system.
 */
class User {
	constructor(
		userID       : string,
		username     : string,
		email        : string,
		displayName  : string,
		pfp          : string,
		creationDate : Date,
	) {
		this.id = userID;
		this.username = username;
		this.email = email;
		this.displayName = displayName;
		this.pfp = pfp;
		this.creationDate = creationDate;
	}

	// Basic user data

	/**
	 * The ID used to reference the user.
	 */
	public id;

	/**
	 * A username which can be used to uniquely identify the user.
	 */
	public username;

	/**
	 * The user's email address.
	 */
	public email;

	/**
	 * The user's chosen display name shown to other users.
	 */
	public displayName;

	/**
	 * A URL leading to the PFP.
	 * This URL should be passed directly to the browser and such should be stored either
	 * on local CDN or by an external provider, such as Cloudinary.
	 */
	public pfp;

	/**
	 * The date the account was created.
	 */
	public creationDate;

	// Functions

	/**
	 * Get the projects the user is in.
	 * @returns An array of the ProjectMember class, in the context of this user.
	 */
	public getProjects() : Array<ProjectMember> {
		return [];
	}

}

export default User;