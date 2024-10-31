// const path = require('path')
import { io } from 'socket.io-client'

class Mysqle {
  constructor(connect) {
    this.socket = null
    this.mysqleEvents = {}
    this.mysqleUri = null
    this.mysqleId = null
    this.mysqleStatus = {}
    this.mysqleConnected = 0
    if (this.connect(connect)) {
      return true
    } else {
      return false
    }
  }
  on(event, callback) {
    this.eventAdd(event)
    if (this.socketIsSet()) {
      this.socket.on(event, callback)
      this.eventsEmit()
      return true
    } else {
      return false
    }
  }
  off(event) {
    if (this.eventIsSet(event)) {
      this.socket.off(event)
      this.eventRemove(event)
      this.eventsEmit()
      return true
    } else {
      return false
    }
  }
  async connect(connect) {
    if (this.config(connect)) {
      if (await this.socketOn()) {
        this.listen()
        return true
      } else {
        return false
      }
    } else {
      return false
    }
  }
  disconnect() {
    if (this.socketConnected()) {
      this.socketOff()
      this.eventsClear()
      return true
    } else {
      return false
    }
  }
  config(config) {
    this.uriSet(config)
    return this.configGet()
  }
  uri(uri) {
    this.uriSet(uri)
    return this.uriGet()
  }
  id() {
    return this.idGet()
  }
  eventsArray() {
    if (this.eventsIsSet()) {
      return Object.keys(this.eventsGet())
    } else {
      return null
    }
  }
  eventsString() {
    return JSON.stringify(this.eventsGet())
  }
  status() {
    if (this.statusEmit()) {
      return this.mysqleStatus
    } else {
      return null
    }
  }
  socketConnected () {
    if (this.socketIsSet()) {
      if (this.idIsSet()) {
        return true
      } else {
        return false
      }
    } else {
      return false
    }
  }
  socketIsSet () {
    if (this.socket != null) {
      return true
    } else {
      return false
    }
  }
  async socketOn () {
    let options = {}
    let uri = this.uriGet()
    if (!this.socketConnected()) {
      options.cookie = false
      // browser handles secure connection
      // node.js causes XHR polling error
      if (typeof process === 'object') {
        options.rejectUnauthorized = false
      }
      this.socket = io(uri, options)
      return true
    } else {
      return false
    }
  }
  socketOff () {
    if (this.socketConnected()) {
      this.socket.disconnect()
      this.socket = null
      return true
    } else {
      return false
    }
  }
  connectedInc () {
    this.mysqleConnected++
    this.statusSet('connected', this.mysqleConnected)
    return true
  }
  socketsSet (sockets) {
    if (typeof sockets !== 'undefined') {
      this.statusSet('sockets', sockets)
      return true
    } else {
      return false
    }
  }
  uriGet () {
    if (this.mysqleUri != null) {
      return this.mysqleUri
    } else {
      return null
    }
  }
  uriSet (uri) {
    if (typeof uri !== 'undefined' &&
      typeof uri === 'string') {
      this.mysqleUri = uri
      this.statusSet('uri', uri)
      return true
    } else {
      return false
    }
  }
  configGet () {
    let config = {
      uri: this.uriGet(),
      events: this.eventsArray()
    }
    return config
  }
  idGet () {
    if (this.idIsSet()) {
      return this.mysqleId
    } else {
      return null
    }
  }
  idIsSet () {
    if (typeof this.mysqleId === 'string' &&
      this.mysqleId.length > 0) {
      return true
    } else {
      return false
    }
  }
  eventAdd (event) {
    if (event != null) {
      this.mysqleEvents[event] = true
      this.statusSet('events', this.eventsString())
      return true
    } else {
      return false
    }
  }
  eventRemove (event) {
    if (event != null) {
      delete this.mysqleEvents[event]
      this.statusSet('events', this.eventsString())
      return true
    } else {
      return false
    }
  }
  eventIsSet (event) {
    if (typeof event === 'string') {
      if (this.eventsIsSet()) {
        if (event in this.eventsGet()) {
          return true
        } else {
          return false
        }
      } else {
        return false
      }
    } else {
      return false
    }
  }
  eventsClear () {
    this.mysqleEvents = {}
    this.statusSet('events', this.eventsString())
    return true
  }
  eventsGet () {
    if (this.eventsIsSet()) {
      return this.mysqleEvents
    } else {
      return null
    }
  }
  eventsIsSet () {
    if (this.mysqleEvents != null &&
      Object.keys(this.mysqleEvents).length > 0) {
      return true
    } else {
      return false
    }
  }
  eventsEmit () {
    this.socket.emit('events', this.eventsArray())
  }
  setId (id) {
    if (id != null) {
      this.mysqleId = id
      this.statusSet('id', id)
      return true
    } else {
      return false
    }
  }
  statusSet (key, value) {
    if (key != null &&
      typeof value !== 'undefined') {
      this.mysqleStatus[key] = value
      return true
    } else {
      return false
    }
  }
  statusEmit () {
    if (typeof this.mysqleStatus !== 'undefined' &&
      Object.keys(this.mysqleStatus).length > 0) {
      this.socket.emit('status', this.mysqleStatus)
      return true
    } else {
      return false
    }
  }
  listen () {
    if (this.socketIsSet()) {
      this.socket.on('connecting', () => {
        // console.log('mysqle-client listen connecting')
      })
      this.socket.on('connect', () => {
        // console.log('mysqle-client listen socket.id: ' + this.socket.id)
        let currentdate = new Date().toLocaleString()
        this.statusSet('connected_at', currentdate)
        this.connectedInc()
        this.setId(this.socket.id)
        this.socket.on('sockets', sockets => {
          this.socketsSet(sockets)
          this.statusEmit()
        })
      })
      this.socket.on('connect_error', (err) => {
        // console.log('mysqle-client error: ')
        // console.log('description: ' + err.description)
        // console.log('type: ' + err.type)
        // console.log('message: ' + err.message)
        // console.log('stack: ' + err.stack)
      })
      this.socket.on('error', (err) => {
        // console.log('mysqle-client listen ' + err)
      })
      return true
    } else {
      return false
    }
  }
}
export default Mysqle