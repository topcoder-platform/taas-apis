/**
 * This service provides operations of UserMeetingSettings.
 */

const _ = require('lodash')
const Joi = require('joi')
const config = require('config')
const helper = require('../common/helper')
const logger = require('../common/logger')
const errors = require('../common/errors')
const models = require('../models')
const {
  processCreate
} = require('../esProcessors/UserMeetingSettingsProcessor')

const UserMeetingSettings = models.UserMeetingSettings
const { Interviews: InterviewConstants } = require('../../app-constants')
const esClient = helper.getESClient()
const NylasService = require('./NylasService')

/**
  * Ensures user is permitted for the operation.
  *
  * @param {Object} currentUser the user who perform this operation.
  * @param {String} userMeetingSettingsUserId the userId of the userMeetingSettings that currentUser is trying to access
  * @throws {errors.ForbiddenError}
  */
async function ensureUserIsPermitted (currentUser, userMeetingSettingsUserId) {
  if (!currentUser.hasManagePermission && !currentUser.isMachine) {
    const userId = await helper.getUserId(currentUser.userId)
    if (userId !== userMeetingSettingsUserId) {
      throw new errors.ForbiddenError(
        `userId: ${userId} cannot access userMeetingSettings ${userMeetingSettingsUserId}`
      )
    }
  }
}

function stripUnwantedData (userMeetingSettings) {
  if (userMeetingSettings.nylasCalendars) {
    userMeetingSettings.nylasCalendars.forEach(function (c, i, a) {
      c = _.omit(c, ['accessToken', 'accountId'])
      a[i] = c
    })
  }
  return userMeetingSettings
}

/**
 * Get UserMeetingsettings by userid
 * @param {Object} currentUser the user who perform this operation.
 * @param {String} userId the user id
 * @param {Boolean} fromDb flag if query db for data or not
 * @returns {Object} the userMeetingSetting object
 */
async function getUserMeetingSettingsByUserId (currentUser, userId, fromDb) {
  // check permission
  await ensureUserIsPermitted(currentUser, userId)
  if (!fromDb) {
    try {
      // get user meeting settings from ES
      const userMeetingSettingsES = await esClient.get({
        index: config.esConfig.ES_INDEX_USER_MEETING_SETTINGS,
        id: userId
      })
      // extract interviews from ES object
      const userMeetingSettings = _.get(userMeetingSettingsES, 'body._source', [])
      if (userMeetingSettings) {
        return stripUnwantedData(userMeetingSettings)
      }
      throw new errors.NotFoundError(`The userMeetingSettings for userId=${userId} not found.`)
    } catch (err) {
      if (helper.isDocumentMissingException(err)) {
        throw new errors.NotFoundError(`The userMeetingSettings for userId=${userId} not found.`)
      }
      logger.logFullError(err, { component: 'UserMeetingSettingsService', context: 'getInterviewByRound' })
      throw err
    }
  }
  // either ES query failed or `fromDb` is set - fallback to DB
  logger.info({ component: 'InterviewService', context: 'getUserMeetingSettingsByUserId', message: 'try to query db for data' })

  const userMeetingSettings = await UserMeetingSettings.findById(userId)
  // throw NotFound error if doesn't exist
  if (!!userMeetingSettings !== true) {
    throw new errors.NotFoundError(`The userMeetingSettings for userId=${userId} not found.`)
  }

  return stripUnwantedData(userMeetingSettings.dataValues)
}
getUserMeetingSettingsByUserId.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  userId: Joi.string().uuid().required(),
  fromDb: Joi.boolean()
}).required()

// TODO document
async function createUserMeetingSettingsIfNotExisting (currentUser, userId, calendar, schedulingPage, transaction) {
  // check permission
  await ensureUserIsPermitted(currentUser, userId)

  let userMeetingSettings = await UserMeetingSettings.findById(userId, false)
  const payload = {
    id: userId,
    defaultAvailableTime: await NylasService.getAvailableTimeFromSchedulingPage(schedulingPage),
    defaultTimezone: await NylasService.getTimezoneFromSchedulingPage(schedulingPage),
    createdBy: await helper.getUserId(currentUser.userId),
    nylasCalendars: [].concat({
      accessToken: calendar.accessToken,
      accountId: calendar.accountId,
      accountProvider: 'nylas', // TODO 🤔 I don't know what to put here, hardcoding for now
      id: calendar.id,
      isPrimary: calendar.is_primary
    })
  }
  if (_.isNil(userMeetingSettings)) {
    userMeetingSettings = await UserMeetingSettings.create(payload, { transaction: transaction })
    await processCreate(userMeetingSettings.toJSON())
  }
  // else {
  //   userMeetingSettings = await userMeetingSettings.update(payload, { transaction: transaction })
  //   await processUpdate(userMeetingSettings.toJSON())
  // }
  return userMeetingSettings
}
createUserMeetingSettingsIfNotExisting.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  userId: Joi.string().uuid().required(),
  calendar: Joi.object().required(),
  schedulingPage:
    Joi.object().keys({
      config: Joi.object().keys({
        timezone: Joi.string().required(),
        booking: Joi.object().keys({
          opening_hours: Joi.array().items(
            Joi.object({
              days: Joi.array().items(Joi.string().valid(
                InterviewConstants.Nylas.Days.Monday,
                InterviewConstants.Nylas.Days.Tuesday,
                InterviewConstants.Nylas.Days.Wednesday,
                InterviewConstants.Nylas.Days.Thursday,
                InterviewConstants.Nylas.Days.Friday,
                InterviewConstants.Nylas.Days.Saturday,
                InterviewConstants.Nylas.Days.Sunday)).required(),
              end: Joi.string().regex(InterviewConstants.Nylas.StartEndRegex).required(),
              start: Joi.string().regex(InterviewConstants.Nylas.StartEndRegex).required()
            }).required()
          ).required()
        }).required().unknown(true)
      }).required().unknown(true)
    }).required().unknown(true),
  transaction: Joi.object()
})

module.exports = {
  getUserMeetingSettingsByUserId,
  createUserMeetingSettingsIfNotExisting
}
