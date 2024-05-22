class User {
	constructor(
		userID       : string,
		username     : string,
		email        : string,
		displayName  : string,
		pfp          : string,
		creationDate : Date,
		projectIDs   : Array<string>,
	) {
		this.userID = userID;
		this.username = username;
		this.email = email;
		this.displayName = displayName;
		this.pfp = pfp;
		this.creationDate = creationDate;
		this.projectIDs = projectIDs;
	}
	// Basic user data

	public userID;
	public username;
	public email;
	public displayName;
	public pfp; // pfp is the URL leading to the user's profile picture. 
	public creationDate;
	public projectIDs; // An array containing all the IDs referencing the projects the user is in.
}

export default User;