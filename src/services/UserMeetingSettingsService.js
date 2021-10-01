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
      throw new errors.UnauthorizedError(
        `userId: ${userId} cannot access userMeetingSettings ${userMeetingSettingsUserId}`
      )
    }
  }
}

function stripUnwantedData (userMeetingSettings) {
  if (userMeetingSettings.nylasCalendars) {
    userMeetingSettings.nylasCalendars.forEach(function (c) {
      c = _.omit(c, ['accessToken', 'accountId'])
    })
  }
  return userMeetingSettings
}

/**
 * Get interview by round
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
      // get job candidate from ES
      const userMeetingSettingsES = await esClient.get({
        index: config.esConfig.ES_INDEX_USER_MEETING_SETTINGS,
        userId: userId
      })
      // extract interviews from ES object
      const userMeetingSettings = _.get(userMeetingSettingsES, 'body._source.user_meeting_settings', [])
      if (userMeetingSettings) {
        return stripUnwantedData(userMeetingSettings)
      }
      throw new errors.NotFoundError(`The userMeetingSettings for userId=${userId} not found.`)
    } catch (err) {
      if (helper.isDocumentMissingException(err)) {
        throw new errors.NotFoundError(`The userMeetingSettings for userId=${userId} not found.`)
      }
      logger.logFullError(err, { component: 'TaasService', context: 'getInterviewByRound' })
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
async function createUserMeetingSettings (userId, calendar, schedulingPage, transaction) {
  const createdUserMeetingSettings = await UserMeetingSettings.create({
    userId: userId,
    defaultAvailableTime: NylasService.getAvailableTimeFromSchedulingPage(schedulingPage),
    defaultTimezone: NylasService.getTimezoneFromSchedulingPage(schedulingPage),
    nylasCalendars: [].concat({
      accessToken: calendar.accessToken,
      accountId: calendar.accountId,
      accountProvider: 'nylas', // TODO 🤔
      id: calendar.id,
      isPrimary: calendar.is_primary
    })
  }, { transaction: transaction })
  const userMeetingSettingsEntity = createdUserMeetingSettings.toJSON()
  await processCreate(userMeetingSettingsEntity)
  return createdUserMeetingSettings
}
createUserMeetingSettings.schema = Joi.object().keys({
  userId: Joi.string().uuid().required(),
  calendar: Joi.object().required(),
  schedulingPage:
    Joi.object().keys({
      config: Joi.object().keys({
        booking: Joi.object().keys({
          timezone: Joi.string().required(),
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
        }).required()
      }).required()
    }).required(),
  transaction: Joi.object()
})

module.exports = {
  getUserMeetingSettingsByUserId,
  createUserMeetingSettings
}
