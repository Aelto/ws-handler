const crypto = require('crypto')
class ClientMap {
  constructor() {
    this.map = {}
  }

  /**
   * 
   * @param {Websocket} ws 
   */
  setclient(ws) {
    do {
      const hash = crypto.randomBytes(16).toString('hex')

      if (!this.map[hash]) {
        this.map[hash] = {
          createDate: Date.now(),
          lastActivity: Date.now(),
          ws, hash
        }
    
        return hash
      }
    } while (true)
  }

  /**
   * 
   * @param {String} hash
   */
  deleteClient(hash) {
    delete this.map[hash]
  }

  deleteClientByWebsocket(ws) {
    for (const hash of Object.keys(this.map)) {
      const client = this.getClient(hash)

      if (client.ws === ws) {
        this.deleteClient(hash)
        return true
      }
    }

    return false
  }

  /**
   * 
   * @param {String} hash
   */
  getClient(hash) {
    return this.map[hash]
  }

  /**
   * 
   * @param {number} delay 
   */
  removeInactiveClient(delay = 1000 * 60) {
    const now = Date.now()

    for (const hash of Object.keys(this.map)) {
      const client = this.getClient(hash)

      if (now - client.lastActivity > delay) {
        this.deleteClient(hash)
      }
    }
  }
}

module.exports = class WsManager {
  constructor() {
    this.events = {}

    this.clients = new ClientMap()
  }

  /**
   * set a new event for the supplied title
   * @param {string} title 
   * @param {Function} fn 
   */
  on(title, fn) {
    this.events[title] = fn

    return this
  }

  /**
   * 
   * @param {string} name 
   * @param {any} obj 
   * @param {WebSocket} ws 
   */
  emit(name, obj, ws) {
    const chosenEvent = this.events[name]
    if (chosenEvent && typeof chosenEvent === 'function') {
      chosenEvent(ws, obj)
    }
  }

  /**
   * 
   * @param {Websocket} wsClient 
   * @param {String} name 
   * @param {{[key: string]: any}} message 
   * @param {Number | undefined} thenableId 
   * @param {Number} state 
   */
  send(wsClient, title, message, thenableId = undefined, state = 200) {
    wsClient.send(JSON.stringify({ title, message, state, thenableId }))
  }

  /**
   * 
   * @param {WebSocket} wsClient 
   * @param {Object} req the received answer
   * @param {String} title 
   * @param {Object} message 
   * @param {Number} state 
   */
  answer(wsClient, req, message, state = 200) {
    this.send(wsClient, req.title + '-done', message, req.thenableId, state)
  }

  /**
   * send a message to all the currently opened connections
   * @param {String} title 
   * @param {Object} message 
   */
  broadcast(title, message) {
    for (const hash of Object.keys(this.clients.map)) {
      const client = this.clients.getClient(hash)

      this.send(client.ws, title + '-done', message)
    }
  }

  /**
   * 
   * @param {Object} message 
   * @param {Websocket} ws 
   * @private
   */
  _onmessage(message, ws) {
    if (message.token && this.clients.doesUserExist(message.token)) {
      message.isAuth = this.clients.isUserAuth(message.token, message.login)

      this.clients.updateActivity(message.token)
    }

    this.emit(message.title, message, ws)
  }

  /**
   * 
   * @param {any} app express app
   * @param {*} path 
   */
  accept(app, path) {
    app.ws(path, (ws, req) => {
      const clientHash = this.clients.setclient(ws)

      ws.on('message', (message) => this._onmessage(JSON.parse(message), ws))
      ws.on('close', () => this.clients.deleteClientByWebsocket(ws))

      this.on('__open__', (ws, req) => this.answer(ws, req, { hash: clientHash }))
    })

    return this
  }
}