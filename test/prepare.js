/*
 * Prepare for tests.
 */
const sinon = require('sinon')
const helper = require('../src/common/helper')
const commonData = require('./unit/common/CommonData')
process.env.NODE_ENV = 'test'
sinon.stub(helper, 'getESClient').callsFake(() => commonData.ESClient)
require('../src/bootstrap')
require('../src/eventHandlers').init()
