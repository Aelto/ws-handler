class WsClient {
  constructor() {
    /**
     * created for later, will be the
     * variable holding the reference
     * of the connection websocket.
     */
    this.ws = null

    /**
     * created for later, will be the
     * variable storing all the event
     * functions by their names.
     */
    this.events = {}

    /**
     * a list of functions executed
     * when the onclose event is fired
     */
    this.oncloseEvents = []

    /**
     * a list of `unique-id: Promise`
     */
    this.thenables = {}

    /**
     * the counter used as a unique id in this.thenables
     */
    this.counter = 0

    this.hash = ''
  }

  /**
   * 
   * @param {String} title 
   * @param {Function} fn 
   */
  on(title, fn) {
    this.events[title] = fn

    return this
  }

  /**
   * 
   * @param {String} title 
   * @param {Function} fn 
   */
  onAnswer(title, fn) {
    this.events[title + '-done'] = fn
  }

  /**
   * 
   * @param {String} title
   * @param {Object} obj
   */
  emit(title, obj) {
    const chosenEvent = this.events[title]
    if (chosenEvent && typeof chosenEvent === 'function') {
      chosenEvent(obj)
    }
  }

  /**
   * 
   * @param {Function} fn 
   */
  addOnclose(fn) {
    this.oncloseEvents.push(fn)
  }

  /**
   * 
   * @param {String} title 
   * @param {Object} message 
   * @param {Number} thenableId 
   */
  send(title, message, thenableId = undefined) {
    this.ws.send(JSON.stringify({ title, message, thenableId, hash: this.hash }))
  }

  /**
   * @returns {Number} new generated id
   */
  generateNewId() {
    this.counter = (this.counter + 1) % 1000

    return this.counter
  }

  /**
   * 
   * @param {Number} id 
   */
  hasThenable(id) {
    return !!this.thenables[id]
  }

  /**
   * 
   * @param {Number} id 
   * @param {Object} data 
   */
  consumeThenable(id, data = null) {
    if (!this.hasThenable(id))
      return

    this.thenables[id](data)

    delete this.thenables[id]
  }

  /**
   * 
   * @param {String} title 
   * @param {Object} message 
   */
  thenable(title, message) {
    const uniqueId = this.generateNewId()
    const promise = new Promise(resolve => {
      this.thenables[uniqueId] = resolve
    })
    
    this.send(title, message, uniqueId)

    return promise 
  }

  /**
   * 
   * @param {Object} e 
   * @private
   */
  _onmessage(e) {
    const message = JSON.parse(e.data)
        
    if (message.thenableId) {
      this.consumeThenable(message.thenableId, message)
    }

    this.emit(message.title, message)
  }

  /**
   * 
   * @param {String} address 
   */
  open(address = `${window.location.hostname}:${window.location.port}`) {
    return new Promise((resolve, reject) => {
      if (window.location.protocol === 'https:') {
        this.ws = new WebSocket(`wss://${address}/ws`)
      }

      else {
        this.ws = new WebSocket(`ws://${address}/ws`)
      }

      this.ws.onopen = _ => resolve()

      this.ws.onclose = e => 
        this.oncloseEvents.forEach(fn => fn())

      this.ws.onmessage = this._onmessage.bind(this)
    })
    .then(() => this.thenable('__open__', {}))
    .then(({ message }) => this.hash = message.hash)
  }
}

window.WsClient = WsClient