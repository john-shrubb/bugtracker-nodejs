# Session

The Session type represents a currently active session allocated after a user successfully authenticated.

Since this isn't really appropriate to describe as an attribute, in the constructor, an `onExpire` anonymous function must be passed, which will be executed automatically when the session reaches it's expiration date. This is a form of self management for the session as constructing it and passing a function to remove it from cache will mean that the inventory does not have to handle setting a timeout for each session.

## Attributes

### id : `string`

The ID used to reference the session.

### sessionToken : `string`

The token the client will have in it's HTTP headers.

It is generally recommended to hash this and keep the salt in the `salt` attribute. This way if an attacker manages to scam a token out of the API it is worthless anyway.

### salt : `string`

The salt used to hash the token generated for the user.

### userAgent : `string`

The user agent tied to the session. If a vastly different user agent attempts to authenticate with the session then it should be invalidated.

### user : `User`

The user the session is tied to.

### issued : `Date`

The date on which the session token was issued.

### expires : `Date`

The date on which the session is supposed to expire.

## Methods

Session does not currently have any methods.

## Relations

-   Related to [User](./user.md) - Uses this type for the `user` attribute.
