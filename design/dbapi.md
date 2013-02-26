# Simple database api

## GET data/:id
Returns complete object at the specified id

## PUT data/:id
Replaces or creates object with specified id witht he bodies content

## POST data/:id
Creates or extends the object with the given id with the attributes and values available in the body

## DELETE data/:id
Removes the object with the specified id

## GET data/:id/:key/length
Returns the length of the (array) attribute at id.key

## GET data/:id/:key
Returns the specified key value

## PUT data/:id/:key
Replaces the specified key with body contents

## DELETE data/:id/:key
Deletes the specified key from object

## POST data/:id/:key
Appends the array at key with the specified values

## POST data/:id/:key/:idx
Inserts body contents at the specified index

## DELETE data/:id/:key/:idx/:amount
Deletes the specified range from array

## POST data/:id/:key/swap/:idx/:idx
Swaps the specified values from array

## GET/PUT data/:id/:key/meta
Returns the specified key meta data

#POST data/:id/renameto/:id ?
Updates id of object an all references to it if target id does not yet exist