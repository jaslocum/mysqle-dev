const config = require('./config.js')

let Common = {
  log (message = null) {
    if (
      message !== null &&
      config.logging === true
    ) {
      console.log(message)
    }
  }
}

/**
 * Module exports.
 */
module.exports = Common
