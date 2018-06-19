# ws-handler
Two classes for a small and simple client/server websocket communication. They are made to work with each other, this means if you use `ws-client` alone it won't always perfectly.
**Note** that the server class uses `express-ws` api.

## Client helper
> Websocket client class located at `/dist/ws-client.js`

### Simple usage example
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

## Server helper
> Websocket client class located at `/dist/ws-server.js`

### Simple usage example
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