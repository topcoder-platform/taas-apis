/**
 * This service provides operations of PaymentService.
 */

const _ = require('lodash')
const Joi = require('joi')
const config = require('config')
const helper = require('../common/helper')
const logger = require('../common/logger')
const constants = require('../../app-constants')

const localLogger = {
  debug: (message) => logger.debug({ component: 'PaymentService', context: message.context, message: message.message }),
  error: (message) => logger.error({ component: 'PaymentService', context: message.context, message: message.message }),
  info: (message) => logger.info({ component: 'PaymentService', context: message.context, message: message.message })
}

/**
  * Create payment
  * @param {Object} options the user who perform this operation
  * @param {Object} options.projectId the user who perform this operation
  * @param {Object} options.userHandle the user who perform this operation
  * @param {Object} options.amount the user who perform this operation
  * @param {Object} options.billingAccountId the user who perform this operation
  * @param {Object} options.name the user who perform this operation
  * @param {Object} options.description the user who perform this operation
  * @returns {Object} the completed challenge
  */
async function createPayment (options) {
  if (_.isUndefined(options.name)) {
    options.name = `TaaS payment for user ${options.userHandle} in project ${options.projectId}`
  }
  if (_.isUndefined(options.description)) {
    options.description = `TaaS payment for user ${options.userHandle} in project ${options.projectId}`
  }
  localLogger.info({ context: 'createPayment', message: 'generating M2MToken' })
  const token = await helper.getM2MToken()
  localLogger.info({ context: 'createPayment', message: 'M2MToken is generated' })
  const challengeId = await createChallenge(options, token)
  await addResourceToChallenge(challengeId, options.userHandle, token)
  await activateChallenge(challengeId, token)
  const completedChallenge = await closeChallenge(challengeId, options.userHandle, token)
  return completedChallenge
}

createPayment.schema = Joi.object().keys({
  options: Joi.object().keys({
    projectId: Joi.number().integer().required(),
    userHandle: Joi.string().required(),
    amount: Joi.number().positive().required(),
    billingAccountId: Joi.number().allow(null),
    name: Joi.string(),
    description: Joi.string()
  }).required()
}).required()

/**
  * Create a new challenge.
  * @param {Object} challenge the challenge to create
  * @param {String} token m2m token
  * @returns {Number} the created challenge id
  */
async function createChallenge (challenge, token) {
  localLogger.info({ context: 'createChallenge', message: 'creating new challenge' })
  const body = {
    status: constants.ChallengeStatus.DRAFT,
    projectId: challenge.projectId,
    name: challenge.name,
    description: challenge.description,
    descriptionFormat: 'markdown',
    typeId: config.TYPE_ID_TASK,
    trackId: config.DEFAULT_TRACK_ID,
    timelineTemplateId: config.DEFAULT_TIMELINE_TEMPLATE_ID,
    prizeSets: [{
      type: 'placement',
      prizes: [{ type: 'USD', value: challenge.amount }]
    }],
    legacy: {
      pureV5Task: true
    },
    tags: ['Other'],
    startDate: new Date()
  }

  if (challenge.billingAccountId) {
    body.billing = {
      billingAccountId: challenge.billingAccountId,
      markup: 0 // for TaaS payments we always use 0 markup
    }
  }
  try {
    const response = await helper.createChallenge(body, token)
    const challengeId = _.get(response, 'id')
    localLogger.info({ context: 'createChallenge', message: `Challenge with id ${challengeId} is created` })
    return challengeId
  } catch (err) {
    localLogger.error({ context: 'createChallenge', message: `Status Code: ${err.status}` })
    localLogger.error({ context: 'createChallenge', message: err.response.text })
    throw err
  }
}

/**
  * adds the resource to the topcoder challenge
  * @param {String} id the challenge id
  * @param {String} handle the user handle to add
  * @param {String} token m2m token
  */
async function addResourceToChallenge (id, handle, token) {
  localLogger.info({ context: 'addResourceToChallenge', message: `adding resource to challenge ${id}` })
  try {
    const body = {
      challengeId: id,
      memberHandle: handle,
      roleId: config.ROLE_ID_SUBMITTER
    }
    await helper.createChallengeResource(body, token)
    localLogger.info({ context: 'addResourceToChallenge', message: `${handle} added to challenge ${id}` })
  } catch (err) {
    localLogger.error({ context: 'addResourceToChallenge', message: `Status Code: ${err.status}` })
    localLogger.error({ context: 'addResourceToChallenge', message: err.response.text })
    throw err
  }
}

/**
  * activates the topcoder challenge
  * @param {String} id the challenge id
  * @param {String} token m2m token
  */
async function activateChallenge (id, token) {
  localLogger.info({ context: 'activateChallenge', message: `Activating challenge ${id}` })
  try {
    const body = {
      status: constants.ChallengeStatus.ACTIVE
    }
    await helper.updateChallenge(id, body, token)
    localLogger.info({ context: 'activateChallenge', message: `Challenge ${id} is activated successfully.` })
  } catch (err) {
    localLogger.error({ context: 'activateChallenge', message: `Status Code: ${err.status}` })
    localLogger.error({ context: 'activateChallenge', message: err.response.text })
    throw err
  }
}

/**
  * closes the topcoder challenge
  * @param {String} id the challenge id
  * @param {String} userHandle the user handle
  * @param {String} token m2m token
  * @returns {Object} the closed challenge
  */
async function closeChallenge (id, userHandle, token) {
  localLogger.info({ context: 'closeChallenge', message: `Closing challenge ${id}` })
  try {
    const { userId } = await helper.getV3MemberDetailsByHandle(userHandle)
    const body = {
      status: constants.ChallengeStatus.COMPLETED,
      winners: [{
        userId,
        handle: userHandle,
        placement: 1
      }]
    }
    const response = await helper.updateChallenge(id, body, token)
    localLogger.info({ context: 'closeChallenge', message: `Challenge ${id} is closed successfully.` })
    return response
  } catch (err) {
    localLogger.error({ context: 'closeChallenge', message: `Status Code: ${err.status}` })
    localLogger.error({ context: 'closeChallenge', message: err.response.text })
    throw err
  }
}

module.exports = {
  createPayment
}
