let Common = require('./common.js')

// mysqle private variables
let event = {}
let clients = {}

let Mysqle = {

  setClient (client, events) {
    if (typeof client !== 'undefined' && client !== null) {
      if (typeof clients[client] === 'undefined') {
        clients[client] = {
          events: {}
        }
      }
      if (events !== null && typeof events !== 'undefined' && events.length > 0) {
        for (let event of events) {
          clients[client].events[event] = true
        }
      } else {
        this.deleteClient (client)
      }
    }
  },

  deleteClient (client) {
    delete clients[client]
  },

  getClient (client) {
    if (typeof clients[client] !== 'undefined') {
      return clients[client]
    } else {
      return null
    }
  },

  getClients () {
    if (typeof clients !== 'undefined') {
      let clientKeys = Object.keys(clients)
      if (clientKeys.length > 0) {
        return clientKeys
      } else {
        return null
      }
    } else {
      return null
    }
  },

  clientEvents (client) {
    let clientObject = this.getClient(client)
    if (clientObject !== null) {
      let clientEvents = Object.keys(clientObject.events)
      return clientEvents
    } else {
      return null
    }
  },

  database () {
    return event.database
  },
  table () {
    return event.table
  },
  type () {
    return event.type
  },
  data () {
    return event.data
  },
  old () {
    return event.old
  },
  id () {
    if (this.type() !== 'delete') {
      return columnOrNull(this.data(),"id")
    } else {
      return columnOrNull(this.old(),"id")
    }
  },

  set (eventObject = null) {
    /*
     * event = {database, type, table, new row data, old row data}
     */
    event = JSON.parse(JSON.stringify(eventObject))
    // Common.log('mysqle set event: ' + JSON.stringify(event, null, 2))
  },

  get () {
    /*
     * event = {database, type, table, new row data, old row data}
     */
    return event
  },

  rowEvents (client) {
    let rowEvents = this.clientEvents(client)
    let props = []
    props[0] = this.database()
    props[1] = this.type()
    props[2] = this.table()
    if (this.id() === null) {
      props[3] = null
    } else {
      props[3] = this.id().toString()
    }
    matchedEvents = []
    if (rowEvents != null) {   
      for (i=0; i<3; i++) {
        let events = rowEvents
        rowEvents = []
        for (let rowEvent of events) {
          // if event is '.' always qualify it as row event
          if (rowEvent === '.') {
              matchedEvents.push(rowEvent)
          } else {
            // if last char is * the disqualied as row event
            if (rowEvent.slice(-1) !== '*') {
              let prop = rowEvent.split('.')[i]
              // if nothing specified in next postion of event the qualify as row event
              if (typeof prop === 'undefined') {
                 matchedEvents.push(rowEvent)
              } 
              // if event property matches property of current event then keep event
              // to check for next position.
              if (prop === props[i] || prop === '*') {
                rowEvents.push(rowEvent)
              }
            }
          }
        }
      }
      let events = rowEvents
      for (let rowEvent of events) {
        let prop = rowEvent.split('.')[i]
        if (typeof prop === 'undefined' ||
          prop === props[i]) {
          matchedEvents.push(rowEvent)
        }
      }
      return matchedEvents
    } else {
      return null
    }
  },

  columnEvents (client, column) {
    let columnEvents = this.clientEvents(client)
    let props = []
    props[0] = this.database()
    props[1] = this.type()
    props[2] = this.table()
    props[3] = this.id()
    props[4] = column
    matchedEvents = []
    if (columnEvents != null) {   
      for (i=0; i<4; i++) {
        let events = columnEvents
        columnEvents = []
        for (let columnEvent of events) {
          let prop = columnEvent.split('.')[i]
          if (typeof prop === 'undefined' && 
            columnEvent.slice(-1) === '*') {
            matchedEvents.push(columnEvent)
          }
          if (prop === props[i] ||
            prop === '*') {
            columnEvents.push(columnEvent)
          }
        }        
      }
      let events = columnEvents
      for (let columnEvent of events) {
        let prop = columnEvent.split('.')[i]
        if (prop === props[i] ||
          prop === '*') {
          matchedEvents.push(columnEvent)
        }
      }
      return matchedEvents
    } else {
      return null
    }
  },

  rowEventData () {
    let rowData = {}
    rowData.database = this.database()
    rowData.type = this.type()
    rowData.table = this.table()
    rowData.id = this.id()
    switch(rowData.type) {
      case 'delete':
        rowData.old = this.old()
        break
      case 'insert':
        rowData.data = this.data()
        break
      case 'update':
        rowData.data = this.data()
        rowData.old = this.old()
    }
    return rowData
  },

  columnEventData (column) {
    let columnData = {
      database: this.database(),
      type: this.type(),
      table: this.table(),
      id: this.id(),
      column: column
    }
    switch(columnData.type) {
      case 'delete':
        columnData.old = columnOrNull(this.old(),column)
        break
      case 'insert':
        columnData.data = columnOrNull(this.data(),column)
        break
      case 'update':        
        columnData.data = columnOrNull(this.data(),column)
        columnData.old = columnOrNull(this.old(),column)
    }
    return columnData
  },
}

function columnOrNull (object, column) {
  if (typeof object !== 'undefined' && 
    object != null &&
    typeof object[column] !== 'undefined') {
    return object[column]
  } else {
    return null
  }
}

/**
 * Module exports.
 */
module.exports = Mysqle
