CacheInvalidationService
========================

This service provides a single means for other inventories to notify eachother that there has been a change to an object. For example, deleting a user would require a notification to be sent.

## Attributes

These attributes are private to prevent accidentally poisoning the cache.

### emitter : `EventEmitter`

Responsible for emitting events when cache is invalidated.

## Methods

### on(eventType : string, callback : function) : `void`

This is used to designate a callback for when there has been a change to an object. This should be used by the inventories themselves.
The possible event types are:
- commentUpdate
- projectUpdate
- projectMemberUpdate
- roleUpdate
- sessionUpdate
- tagUpdate
- ticketUpdate
- userUpdate
Intellisense should be able to suggest these automatically.

### notifyUpdate(updateType : possibleEvents, affectedID : string) : `void`

This method notifies any inventories which registered a callback with the `on()` function that there has been an update to an object.

Use this method whenever an object is created, updated or deleted.