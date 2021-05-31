/*
 * The entry of event handlers.
 */

const config = require('config')
const eventDispatcher = require('../common/eventDispatcher')
const JobEventHandler = require('./JobEventHandler')
const JobCandidateEventHandler = require('./JobCandidateEventHandler')
const ResourceBookingEventHandler = require('./ResourceBookingEventHandler')
const InterviewEventHandler = require('./InterviewEventHandler')
const RoleEventHandler = require('./RoleEventHandler')
const logger = require('../common/logger')

const TopicOperationMapping = {
  [config.TAAS_JOB_UPDATE_TOPIC]: JobEventHandler.processUpdate,
  [config.TAAS_JOB_CANDIDATE_CREATE_TOPIC]: JobCandidateEventHandler.processCreate,
  [config.TAAS_RESOURCE_BOOKING_CREATE_TOPIC]: ResourceBookingEventHandler.processCreate,
  [config.TAAS_RESOURCE_BOOKING_UPDATE_TOPIC]: ResourceBookingEventHandler.processUpdate,
  [config.TAAS_RESOURCE_BOOKING_DELETE_TOPIC]: ResourceBookingEventHandler.processDelete,
  [config.TAAS_INTERVIEW_REQUEST_TOPIC]: InterviewEventHandler.processRequest,
  [config.TAAS_ROLE_DELETE_TOPIC]: RoleEventHandler.processDelete
}

/**
 * Handle event.
 *
 * @param {String} topic the topic name
 * @param {Object} payload the message payload
 * @returns {undefined}
 */
async function handleEvent (topic, payload) {
  if (!TopicOperationMapping[topic]) {
    logger.debug({ component: 'eventHanders', context: 'handleEvent', message: `not interested event - topic: ${topic}` })
    return
  }
  logger.info({ component: 'eventHanders', context: 'handleEvent', message: `event handling - topic: ${topic}` })
  logger.debug({ component: 'eventHanders', context: 'handleEvent', message: `handling event - topic: ${topic} - payload: ${JSON.stringify(payload)}` })
  try {
    await TopicOperationMapping[topic](payload)
  } catch (err) {
    logger.error({ component: 'eventHanders', context: 'handleEvent', message: 'failed to handle event' })
    // throw error so that it can be handled by the app
    throw err
  }
  logger.info({ component: 'eventHanders', context: 'handleEvent', message: `event successfully handled - topic: ${topic}` })
}

/**
 * Attach the handlers to the event dispatcher.
 *
 * @returns {undefined}
 */
function init () {
  eventDispatcher.register({
    handleEvent
  })
}

module.exports = {
  init
}
