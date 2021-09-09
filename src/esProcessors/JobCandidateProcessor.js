/**
 * Jobcandidate Processor
 */

const config = require('config')
const helper = require('../common/helper')

const esClient = helper.getESClient()

/**
  * Process create entity
  * @param {Object} entity entity object
  */
async function processCreate (entity) {
  await esClient.create({
    index: config.get('esConfig.ES_INDEX_JOB_CANDIDATE'),
    id: entity.id,
    body: entity,
    refresh: 'wait_for'
  })
}

/**
  * Process update entity
  * @param {Object} entity entity object
  */
async function processUpdate (entity) {
  await esClient.update({
    index: config.get('esConfig.ES_INDEX_JOB_CANDIDATE'),
    id: entity.id,
    body: {
      doc: entity
    },
    refresh: 'wait_for'
  })
}

/**
  * Process delete entity
  * @param {Object} entity entity object
  */
async function processDelete (entity) {
  await esClient.delete({
    index: config.get('esConfig.ES_INDEX_JOB_CANDIDATE'),
    id: entity.id,
    refresh: 'wait_for'
  })
}

module.exports = {
  processCreate,
  processUpdate,
  processDelete
}
