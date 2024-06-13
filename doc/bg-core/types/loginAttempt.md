LoginAttempt
============

The LoginAttempt represents a clients attempt to authenticate with the API. All attempts are recorded whether successful or not.

## Attributes

### user : `User`

The user the client attempted to authenticate as.

### date : `Date`

When the client attempted to authenticate.

### successful : `boolean`

Whether the authentication was successful.

### ipAddress : `string`

The IP address of the client.

### userAgent : `string`

The user agent given when the client attempted to authenticate.

## Methods

LoginAttempt does not currently have any methods.

## Relations

- Related to [User](./user.md) - Uses this type for the `user` method.