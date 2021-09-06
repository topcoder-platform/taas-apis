/**
 * ResourceBooking Processor
 */

const helper = require('../common/helper')
const config = require('config')

const esClient = helper.getESClient()

/**
 * Process create entity message
 * @param {Object} entity entity object
 */
async function processCreate (entity) {
  await esClient.create({
    index: config.get('esConfig.ES_INDEX_RESOURCE_BOOKING'),
    id: entity.id,
    body: entity,
    refresh: 'true'
  })
}

/**
 * Process update entity message
 * @param {Object} entity entity object
 */
async function processUpdate (entity) {
  await esClient.update({
    index: config.get('esConfig.ES_INDEX_RESOURCE_BOOKING'),
    id: entity.id,
    body: {
      doc: entity
    },
    refresh: 'true'
  })
}

/**
 * Process delete entity message
 * @param {Object} entity entity object
 */
async function processDelete (entity) {
  await esClient.delete({
    index: config.get('esConfig.ES_INDEX_RESOURCE_BOOKING'),
    id: entity.id,
    refresh: 'true'
  })
}

module.exports = {
  processCreate,
  processUpdate,
  processDelete
}
