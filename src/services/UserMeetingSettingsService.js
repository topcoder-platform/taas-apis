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
  processCreate,
  processUpdate
} = require('../esProcessors/UserMeetingSettingsProcessor')

const UserMeetingSettings = models.UserMeetingSettings
const { Interviews: InterviewConstants } = require('../../app-constants')
const esClient = helper.getESClient()
const NylasService = require('./NylasService')
const jwt = require('jsonwebtoken')

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
      accountProvider: calendar.accountProvider || 'nylas', // TODO 🤔 I don't know what to put here, hardcoding for now
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

/**
 * Handle connect calendar callback
 *
 */
async function handleConnectCalendarCallback (reqQuery) {
  // verifying jwt token for request query param - 'state'
  const verifyQueryStateJwt = await jwt.verify(reqQuery.state, 'secret')

  // note userId is actually the UUID in the following line. not to confuse with other 'userId'
  const { userId, redirectTo } = verifyQueryStateJwt

  let errorReason = reqQuery.error
  let result

  // if Nylas sent error when connecting calendar
  if (errorReason) {
    return {
      redirectTo: `${redirectTo}&calendarConnected=false&error=${errorReason}`
    }
  }

  try {
    // getting user's accessToken from Nylas using 'code' found in request query
    const { accessToken, accountId, provider } = await NylasService.getAccessToken(reqQuery.code)

    // view https://developer.nylas.com/docs/api/#post/oauth/token for error response schema
    if (!accessToken || !accountId) {
      throw new Error('Error during getting access token for the calendar.')
    }

    // getting user's all existing calendars
    const calendars = await NylasService.getExistingCalendars(accessToken)

    if (!Array.isArray(calendars) || calendars.length < 1) {
      throw new Error('Error getting calendar data for the user.')
    }

    const primaryCalendar = calendars.find(c => c.is_primary)

    const calendarDetails = {
      accessToken,
      accountId,
      accountProvider: provider,
      id: primaryCalendar.id,
      isPrimary: true
    }

    const currentUserDetails = await helper.getUserDetailsByUserUUID(userId)

    // note currentUserDetails.userId in the following line is the integer userId
    // not to confuse with user's UUID
    const currentUser = { userId: currentUserDetails.userId }

    let userMeetingSettings = await UserMeetingSettings.findById(userId, false)

    // reuse this method to create UserMeetingSettings object
    if (_.isNil(userMeetingSettings)) {
      userMeetingSettings = await createUserMeetingSettingsIfNotExisting(
        currentUser,
        userId,
        calendarDetails,
        {
          config: {
            timezone: primaryCalendar.timezone,
            booking: { opening_hours: [] }
          }
        })
      await processCreate(userMeetingSettings)
    } else { // or just update calendar details in the exisiting object
      const calendarIndexInUserMeetingSettings = _.findIndex(userMeetingSettings.nylasCalendars, (item) => item.id === calendarDetails.id)

      // clone Nylas calendar array and
      // if array item's index doesn't match with calendar index saved in Nylas backend, make it non-primary
      // but if it matches, update the calendar with newer details (which makes it primary too)
      const updatedNylasCalendarsArray = _.map(Array.from(userMeetingSettings.nylasCalendars), (item, index) => {
        if (index !== calendarIndexInUserMeetingSettings) { return { ...item, isPrimary: false } }

        return { ...item, ...calendarDetails }
      })

      // if calendar doesn't exist in Nylas calendars array then add it in the array
      const updatePayload = {
        ...userMeetingSettings,
        nylasCalendars: calendarIndexInUserMeetingSettings === -1 ? updatedNylasCalendarsArray.concat(calendarDetails) : updatedNylasCalendarsArray
      }

      const updateUserMeetingSettingsResponse = await UserMeetingSettings.update(updatePayload, { where: { id: userMeetingSettings.id }, returning: true, transaction: null })
      userMeetingSettings = updateUserMeetingSettingsResponse[1][0].dataValues
      await processUpdate(userMeetingSettings)
    }
  } catch (err) {
    errorReason = encodeURIComponent(err.message)
  } finally {
    if (errorReason) {
      result = {
        redirectTo: `${redirectTo}&calendarConnected=false&error=${errorReason}`
      }
    }

    result = {
      redirectTo: `${redirectTo}&calendarConnected=true`
    }
  }

  return result
}

handleConnectCalendarCallback.schema = Joi.object().keys({
  reqQuery: Joi.object()
}).required()

/**
 * Delete a calendar from UserMeetingSettings object
 */
async function deleteUserCalendar (currentUser, reqParams) {
  // check permission
  await ensureUserIsPermitted(currentUser, reqParams.userId)

  try {
    const userMeetingSettings = await getUserMeetingSettingsByUserId(currentUser, reqParams.userId)

    // error if no calendar found with the given id in request param
    if (
      _.findIndex(
        userMeetingSettings.nylasCalendars,
        (calendarItem) => calendarItem.id === reqParams.calendarId
      ) === -1
    ) {
      throw new errors.NotFoundError(`Calendar with id "${reqParams.calendarId}" not found in UserMeetingSettings record.`)
    } else {
      let deletingPrimaryCalendar

      // filter all calenders except the one to be deleted and
      // check if deleting calendar is primary
      const remainingCalendars = _.filter(userMeetingSettings.nylasCalendars, (item) => {
        if (item.id === reqParams.calendarId && item.isPrimary) {
          deletingPrimaryCalendar = true
        }

        return item.id !== reqParams.calendarId
      })

      // if deleting primary calendar, make the first remaining calendar as primary
      if (remainingCalendars.length > 0 && deletingPrimaryCalendar) {
        _.set(remainingCalendars[0], 'isPrimary', true)
      }

      const updatePayload = {
        ...userMeetingSettings,
        nylasCalendars: remainingCalendars
      }

      const updateUserMeetingSettingsResponse = await UserMeetingSettings.update(updatePayload, { where: { id: userMeetingSettings.id }, returning: true, transaction: null })
      const updatedUserMeetingSettings = updateUserMeetingSettingsResponse[1][0].dataValues
      await processUpdate(updatedUserMeetingSettings)
    }
  } catch (err) {
    throw new errors.BadRequestError(err.message)
  }
}

deleteUserCalendar.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  reqParams: Joi.object().keys({
    userId: Joi.string().uuid().required(),
    calendarId: Joi.string().required()
  }).required()
}).required()

module.exports = {
  getUserMeetingSettingsByUserId,
  createUserMeetingSettingsIfNotExisting,
  handleConnectCalendarCallback,
  deleteUserCalendar
}
