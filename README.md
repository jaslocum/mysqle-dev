# mysqle

## server setup

    // install
    git clone https://github.com/jaslocum/mysqle
    cd mysqle
    npm install

    // Change config.js to your database connection settings and change serverId if necessary.
    
    // to start event server from mysqle install directory
    npm start

## How to use

event subscription sting format:

'database.type.table.id.column'

    database: database name to listen to for events
    type:     event type can be 'insert', 'update' or 'delete'
    table:    table name to listen to for change events
    id:       id value of record for change events
    column:   column name for change events

Any event string that ends in a column name or an asterisk will receive column level events. For column level events, a separte event will be triggered for each column effected by a change.  For example, if the table users has a user_name and id then if a new user is added two column events would be emitted.  One event for the user_name being added and another event for the id being added.

Event strings that do not include a column name and do not end in an asterisk will generate only one event for any row change. In the case of a user table with a user_name and id field, only one event would be returned if a row is added, deleted or changed. If both the user_name and id field are changed for the same record, only one event is emitted that contains the changes for each field. The event subscription string of '.' will trigger row events for all changes to all databases in the connection.

Subscribe to mysqle-server events:

    // use the following for Node.JS server side usage or for server side pre-rendered javascript
    // in the project directory install using the following requirements:
    
    npm install socket.io-client --save
    npm install jaslocum/mysqle --save
    
    // or equivalents such as yarn for the above installs:
    
    yarn add socket.io-client
    yarn add jaslocum/mysqle
 
    // import the mysqle module into your code
    
    import mysqleModule from 'mysqle/mysqle-client-module'
    let mysqle = new mysqleModule(config.mysqle.connect)

    // -- OR --
    
    // to use on the client side that is rendered by a browser 
    // use the following to load the socket.io-client from the mysqle event server
    <script src="http://hostname:port/socket.io/socket.io.js"></script>
    // include mysqle-client.js script from the directory serving javascript files
    <script src="mysqle-client.js"></script>
    
    // -- OR --
    
    // use require
    
    const mysqle = require('mysqle/mysqle-client')

    // -- THEN --
    
    <script>

      // hostname of the event mysle server installed above
      // port defaults to 3307 and can be changed in config.js of the mysqle event server
      mysqle.connect('http://hostname:port')
      
      // subscribe to all column events
      mysqle.on('*', function (data) {
        console.log('* event: ' + data)
      })

      // subscribe to all row events
      mysqle.on('.', function (data) {
        console.log('. event: ' + data)
      })

      // subscribe to all row events for users table in the database named company
      mysqle.on('company.*.users', function (data) {
        console.log('company.*.users event: ' + data)
      })

      // subscribe to all column events for users table in the database named company
      // where record id is 1 and the column user_name is changed
      mysqle.on('company.*.users.1.user_name', function (data) {
        console.log('company.*.users.1.user_name event: ' + data)
      })
    
      // subscribe to all row events for users table in the database named company
      // where record id is 1
      mysqle.on('company.*.users.1', function (data) {
        console.log('company.*.users.1 event: ' + data)
      })
    
      // subscribe to delete row events for the users table in the database named company
      mysqle.on('company.delete.users', function (data) {
        console.log('company.delete.users event: ' + data)
      })
    </script>
