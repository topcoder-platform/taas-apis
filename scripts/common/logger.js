/*
 * Logger for scripts.
 */

module.exports = {
  info: (message) => console.log(`INFO: ${message}`),
  debug: (message) => console.log(`DEBUG: ${message}`),
  warn: (message) => console.log(`WARN: ${message}`),
  error: (message) => console.log(`ERROR: ${message}`)
}
