const WsServer = require('../dist/ws-server.js')
const expressWsInit = require('express-ws')
const express = require('express')
const path = require('path')

const app = express()
const expressWs = expressWsInit(app)

const HTML_PATH = path.join(__dirname, 'index.html')
const DIST_PATH = path.join(__dirname, '../dist')
const SERVER_PORT = 3000

app.get('/', (req, res) => res.sendFile(HTML_PATH))
app.use('/', express.static(DIST_PATH))

const serverWs = new WsServer()
  .accept(app, '/ws')

serverWs.on('new-message', (ws, { message }) =>
  serverWs.broadcast('new-message', { text: message.text }))

app.listen(SERVER_PORT, () => console.log(`listening on port ${SERVER_PORT}`))