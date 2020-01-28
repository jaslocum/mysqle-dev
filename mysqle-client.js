const io = require('socket.io-client')

// module private var
let socket = null
let mysqleEvents = {}
let mysqleUri = null
let mysqleId = null
let mysqleStatus = {}
let mysqleConnected = 0

let mysqle = {

  on: function (event, callback) {
    eventAdd(event)
    if (socketIsset()) {
      socket.on(event, callback)
      eventsEmit()
      return true
    } else {
      return false
    }
  },

  off: function (event) {
    if (eventIsset(event)) {
      socket.off(event)
      eventRemove(event)
      eventsEmit()
      return true
    } else {
      return false
    }
  },

  connect: function (config) {
    if (this.config(config)) {
      if (socketOn()) {
        listen()
        return true
      } else {
        return false
      }
    } else {
      return false
    }
  },

  disconnect: function () {
    if (socketConnected()) {
      socketOff()
      eventsClear()
      return true
    } else {
      return false
    }
  },

  config: function (config) {
    uriSet(config)
    return configGet()
  },

  uri: function (uri) {
    uriSet(uri)
    return uriGet()
  },

  id: function () {
    return idGet()
  },

  events_array: function () {
    if (eventsIsset()) {
      return Object.keys(eventsGet())
    } else {
      return null
    }
  },

  events_string: function () {
    return JSON.stringify(eventsGet())
  },

  status: function () {
    if (statusEmit()) {
      return mysqleStatus
    } else {
      return null
    }
  }
}

function socketConnected () {
  if (socketIsset()) {
    if (idIsset()) {
      return true
    } else {
      return false
    }
  } else {
    return false
  }
}

function socketIsset () {
  if (socket != null) {
    return true
  } else {
    return false
  }
}

function socketOn () {
  if (!socketConnected()) {
    socket = io(uriGet(), {
      cookie: false
    })
    return true
  } else {
    return false
  }
}

function socketOff () {
  if (socketConnected()) {
    socket.disconnect()
    socket = null
    return true
  } else {
    return false
  }
}

function connectedInc () {
  mysqleConnected++
  statusSet('connected', mysqleConnected)
  return true
}

function socketsSet (sockets) {
  if (typeof sockets !== 'undefined') {
    statusSet('sockets', sockets)
    return true
  } else {
    return false
  }
}

function uriGet () {
  if (mysqleUri != null) {
    return mysqleUri
  } else {
    return null
  }
}

function uriSet (uri) {
  if (typeof uri !== 'undefined' &&
    typeof uri === 'string') {
    mysqleUri = uri
    statusSet('uri', uri)
    return true
  } else {
    return false
  }
}

function configGet () {
  var config = {
    uri: uriGet(),
    events: mysqle.events_array()
  }
  return config
}

function idGet () {
  if (idIsset()) {
    return mysqleId
  } else {
    return null
  }
}

function idIsset () {
  if (typeof mysqleId === 'string' &&
    mysqleId.length > 0) {
    return true
  } else {
    return false
  }
}

function eventAdd (event) {
  if (event != null) {
    mysqleEvents[event] = true
    statusSet('events', mysqle.events_string())
    return true
  } else {
    return false
  }
}

function eventRemove (event) {
  if (event != null) {
    delete mysqleEvents[event]
    statusSet('events', mysqle.events_string())
    return true
  } else {
    return false
  }
}

function eventIsset (event) {
  if (typeof event === 'string') {
    if (eventsIsset()) {
      if (event in eventsGet()) {
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

function eventsClear () {
  mysqleEvents = {}
  statusSet('events', mysqle.events_string())
  return true
}

function eventsGet () {
  if (eventsIsset()) {
    return mysqleEvents
  } else {
    return null
  }
}

function eventsIsset () {
  if (mysqleEvents != null &&
    Object.keys(mysqleEvents).length > 0) {
    return true
  } else {
    return false
  }
}

function eventsEmit () {
  socket.emit('events', mysqle.events_array())
}

function setId (id) {
  if (id != null) {
    mysqleId = id
    statusSet('id', id)
    return true
  } else {
    return false
  }
}

function statusSet (key, value) {
  if (key != null &&
    typeof value !== 'undefined') {
    mysqleStatus[key] = value
    return true
  } else {
    return false
  }
}

function statusEmit () {
  if (typeof mysqleStatus !== 'undefined' &&
    Object.keys(mysqleStatus).length > 0) {
    socket.emit('status', mysqleStatus)
    return true
  } else {
    return false
  }
}

function listen () {
  if (socketIsset()) {
    socket.on('connect', function () {
      var currentdate = new Date().toLocaleString()
      statusSet('connected_at', currentdate)
      connectedInc()
      setId(socket.id)
      socket.on('sockets', function (sockets) {
        socketsSet(sockets)
        statusEmit()
      })
    })
    return true
  } else {
    return false
  }
}
/**
 * Module exports.
 */
module.exports = mysqle
