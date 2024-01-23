/*
 * Prepare for tests.
 */
process.env.NODE_ENV = 'test'
require('../src/bootstrap')
require('../src/eventHandlers').init()
