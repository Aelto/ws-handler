# ws-handler
Two classes for a small and simple client/server websocket communication. They are made to work with each other, this means if you use `ws-client` alone it won't always perfectly.
**Note** that the server class uses `express-ws` api.

# Client helper
Websocket client class located at:
- [/dist/ws-client-global.js](/dist/ws-client-global.js) for a browser usage (`window.WsClient`)
- [/dist/ws-client-module.js](/dist/ws-client-module.js) for a module usage (`export default` syntax)

## Simple usage example
> the code has been skimmed to keep it focused on what matter: the classes.
> complete example can be found at [/example/index.html](/example/index.html)
```js
import WsClient from './ws-client.js'

const client = new WsClient()

client
.on('new-message-done', ({ message }) => addMessage(message.text))
.open()

const sendNewMessage = text =>
  client.send('new-message', { text })

// ...
```

## API

### Constructor()
instantiate a new Websocket client


```js
const client = new WsClient()
```

### on(title: string, fn: ({ message: { [string]: any } }) => void)
Set an event listener that will be called everytime an incoming object has the same `title` as the supplied one.
```js
client.on('event', { message } => console.log(message.myEventText))
```

### onAnswer(`title: string, fn: ({ message: { [string]: any } }) => void`)
Exactly the same as the [on](#on) method, but appends `-done` at `title`. _this is because the server class also appends `-done` to any event he answers, it's a way to know when the server pushes an event and when he answers to an event._

```js
client.onAnswer('event', { message } => console.log(message.myEventText))
```

### emit(`title: string, obj: { message: { [string]: any } }`)
This is an internal method that is _public_ as it can be useful when someone wants to manually trigger events. `title` is the event's name and `obj` is the data passed to the event function.

```js
client.emit('event', { message: { myEventText: 'hello' } })
```
> note that the `myEventText` key can be whatever you want

### addOnClose(`fn: () => void`)
Add a function that will be called once the websocket connection is closed.

```js
client.addonClose(() => alert('websocket connection lost'))
```

### send(`title: string, message: { [string]: any }, thenableId: number | undefined`)
Send a message with the current websocket connection where `title` is the event name to trigger on the server side, `message` is the data sent to the server

```js
client.send('add-user', { username: 'user_1' })

```

### generateNewId(): `number`
Internal method set to _public_ just in case someone wants to generate a number between 0 and 100.

### hasThenable(`id: number`): `boolean`
Returns true if a promise linked to the given id is waiting for its resolution.

### consumeThenable(`id: number, data = null: { [string]: any }`)
Resolve the stored thenable promise by passing it the supplied data then delete it.

```js
client.consumeThenable(0, { username: 'user_1' })
```

### thenable(`title: string, message: { [string]: any }`): `Promise`
Send the supplied data with the given event title. This method returns a promise that is resolved once the server answers back.

```js
client.thenable('add-user', { username: 'user_1' })
.then({ message } => console.log(`response: ${message}`))
```

### open(`address = '${window.location.hostname}:${window.location.port}'`)
Open the websocket connection to the given address.

# Server helper
Websocket client class located at [/dist/ws-server.js](/dist/ws-server.js)

## Simple usage example
> the code has been skimmed to keep it focused on what matter: the classes.
> complete example can be found at [/example/index.js](/example/index.js)
```js
import WsServer from './ws-server.js'

// ...

const serverWs = new WsServer()
  .accept(app, '/ws')

serverWs.on('new-message', (ws, { message }) => 
  serverWs.broadcast('new-message', { text: message.text }))

// ...
```