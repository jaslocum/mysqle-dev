const Mysqle = require('./mysqle')
const Config = require('./config')
const TableMap = require('./tablemap')
const Common = require('./common.js')
const {parse, stringify} = require('flatted/cjs')

const fs = require('fs')
const path = require('path')
const https = require('https')
const app = require('express')
const key = fs.readFileSync(path.resolve('/etc/ssl/private', 'privkey.pem'))
const cert = fs.readFileSync(path.resolve('/etc/ssl/certs', 'cert.pem'))
const portHttps = Config.port;
const serverHttps = https.createServer({
  key: key,
  cert: cert
}, app).listen(portHttps)

// socketio connects to port to serve events to client subscribers
let io = require('socket.io').listen(serverHttps, { cookie: false })

// count reconnection attempts
let connectAttempts = 0

//ZongJi mysql binlog listener
let ZongJi = require('zongji')
let zongji = false
// start binlog
start()

/*
 * start binlog -- serverId must be specified and unique
 * for each instance of ZongJi
 */
function start () {
  if (zongji){
    zongji.stop()
  }
  zongji = new ZongJi(Config.connection)
  zongji.start({
    startAtEnd: true,
    serverId: Config.serverId,
    includeEvents: ['tablemap', 'writerows', 'updaterows', 'deleterows']
  })
  /*
   * event = {database, operation type, table, new row data, old row data}
   */
  zongji.on('binlog', (event) => {
    binlogEvent(event)
  })
  // listen for error
  zongji.on('error', function(err) {
    Common.log()
    Common.log('zongji error: ' + JSON.stringify(err))
    Common.log()
    connectAttempts++
    if (connectAttempts < Config.connectMax){
      start()
      Common.log()
      Common.log('connection attempts: ' + connectAttempts)
      Common.log()
    } else {
      Common.log()
      Common.log('mysqle event server stopping after connection attempts: ' + connectAttempts)
      Common.log()
      zongji.stop()
      process.exit()
    }
  })
}

function binlogEvent(event) {

  // reset connectAttempts to 0 when binlog event is received
  connectAttempts = 0

  switch (event.getEventName()) {
    // database and table for next event
    case 'tablemap':
      TableMap.set(event.tableId, event.schemaName, event.tableName)
      // Common.log('mysqle-server binlogEvent tableMap.get(' + event.tableId + '): ' + stringify(TableMap.get(event.tableId), null, 2))
      break
    // insert
    case 'writerows':
      Mysqle.set(
        {
          database: TableMap.get(event.tableId).schema,
          type: 'insert',
          table: TableMap.get(event.tableId).tableName,
          data: event.rows[0],
          old: null
        }
      )
      // Common.log('mysqle-server binlogEvent writerows event: ' + stringify(Mysqle.get(), null, 2))
      emitRowEvents()
      for (let column in Mysqle.data()) {
        emitColumnEvents(column)  
      }
      break
    // update
    case 'updaterows':
      // handle multiple rows
      for (let eventRow of event.rows) {
        Mysqle.set(
          {
            database: TableMap.get(event.tableId).schema,
            type: 'update',
            table: TableMap.get(event.tableId).tableName,
            data: eventRow.after,
            old: eventRow.before
          }
        )
        // Common.log('mysqle-server binlogEvent updaterows event: ' + stringify(Mysqle.get(), null, 2))
        emitRowEvents()
        for (let column in Mysqle.data()) {
          if (Mysqle.data()[column] !== Mysqle.old()[column]) {
            emitColumnEvents(column)
          }
        }
      }
      break
    // delete
    case 'deleterows':
      Mysqle.set(
        {
          database: TableMap.get(event.tableId).schema,
          type: 'delete',
          table: TableMap.get(event.tableId).tableName,
          data: null,
          old: event.rows[0]
        }
      )
      // emit database events for delete
      // Common.log('mysqle-server binlogEvent deleterows event: ' + stringify(Mysqle.get(), null, 2))
      emitRowEvents()  
      for (let column in Mysqle.old()) {    
        emitColumnEvents(column)   
      }
      break
  }
}

// listen for termination
process.on('SIGINT', function() {
  zongji.stop()
  process.exit()
})

function emitRowEvents () {
  let clients = Mysqle.getClients()
  if (clients !== null){
    for (let client of clients){
      let eventNames = Mysqle.rowEvents(client)
      for (let eventName of eventNames){
        emitEvent(client, eventName, Mysqle.rowEventData())
      }  
    }
  }
}

function emitColumnEvents (column) {
  let clients = Mysqle.getClients()  
  if (clients !== null){
    for (let client of clients){
      let eventNames = Mysqle.columnEvents(client, column)
      for (let eventName of eventNames){
        emitEvent(client, eventName, Mysqle.columnEventData())  
      }
    }
  }
}

function emitEvent (client, eventName, eventData) {
  if (eventName !== null && eventData !== null){
    io.to(client).emit(eventName, eventData)
  }
}

let socketCount = 0  

io.sockets.on('connection', (socket) => {
  let client = socket.id
  Common.log('mysqle-server sockets.on connection id: ' + client)
  socket.on('events', (events) => {
    Common.log('io.socket.on: client, events: ' + client + ', ' + events)
    Mysqle.setClient(client, events)
  })
  socket.on('status', (status) => {
    let currentdate = new Date().toLocaleString()   
    if (status !== null && Object.keys(status).length > 0) {
      io.sockets.to(client).emit('status', JSON.stringify(status))  
    }
  })  
  socket.on('disconnect', (reason) => {
    // Decrease the socket count on a disconnect, emit
    socketCount--
    Mysqle.deleteClient(client)
    io.sockets.emit('sockets', JSON.stringify(socketCount))  
  })  
  // Socket has connected, increase socket count
  socketCount++  
  // Let all sockets know how many are connected
  io.sockets.emit('sockets', JSON.stringify(socketCount))  
})  
