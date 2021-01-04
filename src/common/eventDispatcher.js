/*
 * Implement an event dispatcher that handles events synchronously.
 */

const handlers = []

/**
 * Handle event.
 *
 * @param {String} topic the topic name
 * @param {Object} payload the message payload
 * @returns {undefined}
 */
async function handleEvent (topic, payload) {
  for (const handler of handlers) {
    await handler.handleEvent(topic, payload)
  }
}

/**
 * Register to the dispatcher.
 *
 * @param {Object} handler the handler containing the `handleEvent` function
 * @returns {undefined}
 */
function register (handler) {
  handlers.push(handler)
}

module.exports = {
  handleEvent,
  register
}
