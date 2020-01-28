let config = {

  /*
    database connection
  */
  connection: {
    host: 'eagle',
    port: '3306',
    user: 'repl',
    password: 'trudr8b4',
    timezone: 480
  },

  /*
    must be specified and unique for each instance of ZongJi reading binlog events for database
  */
  serverId: 12,
  
  /*
    port for event clients to connect to
  */
  port: '3308',

  /*
    connection retry settings
  */
  connectMax: 30,

  /*
    logging status
  */
  logging: true

}

module.exports = config
