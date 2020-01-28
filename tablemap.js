// all common routines
let Common = require('./common.js')
const {parse, stringify} = require('flatted/cjs')

let tables = {}

TableMap = {

  /*
   * persistent schema for "next" future event
   */

  set (tableId = null, schema = null, tableName = null) {
    if (
      tableId !== null
    ) {
      tables[tableId] = {
        schema: schema,
        tableName: tableName
      }
      // Common.log('tablemap set tables['+ tableId +']: ' + stringify(tables[tableId], null, 2))
      return tables[tableId]
    }
  },

  /*
   * persistent table for "next" future event
   */
  get (tableId = null) {
    let table = {
      schema: null,
      tableName: null
    }
    if (
      tableId !== null
    ) {
      table = tables[tableId]
    }
    // Common.log('tablemap get tableId: '+ tableId +', table: ' + stringify(table, null, 2))
    return table
  }
}

module.exports = TableMap
