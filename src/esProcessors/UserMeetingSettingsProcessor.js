/**
 * UserMeetingSettings Processor
 */

const config = require('config')
const helper = require('../common/helper')
const _ = require('lodash')

const esClient = helper.getESClient()

/**
  * Process create entity
  * @param {Object} entity entity object
  */
async function processCreate (entity) {
  await esClient.create({
    index: config.get('esConfig.ES_INDEX_USER_MEETING_SETTINGS'),
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
    index: config.get('esConfig.ES_INDEX_USER_MEETING_SETTINGS'),
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
    index: config.get('esConfig.ES_INDEX_USER_MEETING_SETTINGS'),
    id: entity.id,
    refresh: 'wait_for'
  })
}

/**
  * Creates if records doesn't exist and updates if exists
  * @param {Object} entity entity object
  */
async function processCreateOrUpdate (entity) {
  let userMeetingSettingsESResponse
  try {
    userMeetingSettingsESResponse = await esClient.get({
      index: config.esConfig.ES_INDEX_USER_MEETING_SETTINGS,
      id: entity.id
    })

    // if records already exist, then update
    if (_.get(userMeetingSettingsESResponse, 'body._source')) {
      await processUpdate(entity)
    } else {
      await processCreate(entity)
    }
  } catch (err) {
    // if error happens due to missing document, then try to create it
    if (helper.isDocumentMissingException(err)) {
      await processCreate(entity)
    } else {
      throw err
    }
  }
}

module.exports = {
  processCreate,
  processUpdate,
  processDelete,
  processCreateOrUpdate
}
