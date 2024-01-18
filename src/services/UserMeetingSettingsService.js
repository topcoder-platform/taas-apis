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
const { v4: uuid } = require('uuid')

const UserMeetingSettings = models.UserMeetingSettings
const { Interviews: InterviewConstants, NylasVirtualCalendarProvider } = require('../../app-constants')
const NylasService = require('./NylasService')
const jwt = require('jsonwebtoken')
const { runExclusiveCalendarConnectionHandler } = require('../common/helper')

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

/**
 * Strips unwanted data from the userMeetingSettings object
 *
 * Specifically, it removes any calendars with property 'isDeleted' set to true &
 * it removes the properties 'accessToken' & 'accountId' from the calendars
 *
 * @param {object} userMeetingSettings
 * @returns userMeetingSettings with modified data
 */
function stripUnwantedData (userMeetingSettings) {
  if (userMeetingSettings.nylasCalendars) {
    const availableCalendars = _.flatMap(
      userMeetingSettings.nylasCalendars,
      (item) => !item.isDeleted ? _.omit(item, ['accessToken', 'accountId', 'isDeleted']) : []
    )

    userMeetingSettings.nylasCalendars = availableCalendars
  }

  return userMeetingSettings
}

function handleUserMeetingSettingsData (data, shouldNotStripUnwantedData) {
  return shouldNotStripUnwantedData ? data : stripUnwantedData(data)
}

/**
 * Get UserMeetingsettings by userid
 * @param {Object} currentUser the user who perform this operation.
 * @param {String} userId the user id
 * @param {Boolean} fromDb flag if query db for data or not
 * @param {object} options { shouldNotStripUnwantedData: false }
 *  shouldNotStripUnwantedData - flag indicating if unwanted data should be stripped or not
 * @returns {Object} the userMeetingSetting object
 */
async function getUserMeetingSettingsByUserId (currentUser, userId, fromDb, options = { shouldNotStripUnwantedData: false }) {
  // check permission
  await ensureUserIsPermitted(currentUser, userId)

  // either ES query failed or `fromDb` is set - fallback to DB
  logger.info({ component: 'InterviewService', context: 'getUserMeetingSettingsByUserId', message: 'try to query db for data' })

  const userMeetingSettings = await UserMeetingSettings.findById(userId)

  return handleUserMeetingSettingsData(userMeetingSettings, options.shouldNotStripUnwantedData)
}
getUserMeetingSettingsByUserId.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  userId: Joi.string().required(),
  fromDb: Joi.boolean(),
  options: Joi.object().keys({
    shouldNotStripUnwantedData: Joi.boolean()
  })
}).required()

/**
 * Create UserMeetingSettings if it doesn't exist for user
 * or updates existent records if it exists
 *
 * This method kind of merge provided data with existent
 *
 * @param {Object} currentUser current user object
 * @param {Object} data data to sync
 * @param {Object} data.id UserMeetingSettings id (user UUID)
 * @param {Object} data.defaultAvailableTime default availability time to set
 * @param {Object} data.defaultTimezone default timezone to set
 * @param {Object} data.calendar calendar to add or update
 * @param {Object} transaction transaction
 * @returns {Object} existent or created UserMeetingSettings record
 */
async function syncUserMeetingsSettings (currentUser, data, transaction) {
  // check permission
  await ensureUserIsPermitted(currentUser, data.id)

  let userMeetingSettings = await UserMeetingSettings.findOne({
    where: {
      id: data.id
    }
  })

  // if UserMeetingSettings doesn't exist yet, then we crate it for the user
  if (!userMeetingSettings) {
    const entity = _.pick(data, ['id', 'defaultAvailableTime', 'defaultTimezone'])

    entity.createdBy = await helper.getUserId(currentUser.userId)

    if (data.calendar) {
      entity.nylasCalendars = [data.calendar]
    }

    // set empty array by default if not defined
    if (!entity.defaultAvailableTime) {
      entity.defaultAvailableTime = []
    }

    userMeetingSettings = await UserMeetingSettings.create(entity, { transaction: transaction })

  // if UserMeetingSettings record already exists for the user we update it
  } else {
    const updatePayload = userMeetingSettings.toJSON()

    _.forEach(['defaultAvailableTime', 'defaultTimezone'], (updatedProp) => {
      // we only update values if provided new values are non-null
      // so we don't remove existent values
      if (data[updatedProp]) {
        updatePayload[updatedProp] = data[updatedProp]
      }
    })

    updatePayload.updatedBy = await helper.getUserId(currentUser.userId)

    // add or update calendar if it was provided
    if (data.calendar) {
      const calendarIndexInUserMeetingSettings = _.findIndex(userMeetingSettings.nylasCalendars, {
        // we only allow one calendar by the pair of email/accountProvider
        email: data.calendar.email,
        accountProvider: data.calendar.accountProvider
      })

      const updatedNylasCalendarsArray = _.map(userMeetingSettings.nylasCalendars || [], (item, index) => {
        // process all other calendar, except the one wa are adding/updating
        if (index !== calendarIndexInUserMeetingSettings) {
          const updatedItem = { ...item }

          // if we are adding primary calendar, then make all other calendars non-primary
          if (data.calendar.isPrimary) {
            updatedItem.isPrimary = false
          }

          // if we are adding not-Nylas calendar, mark all other not-Nylas calendars as removed, as we don't allow having multiple not-Nylas calendars
          if (data.calendar.accountProvider !== NylasVirtualCalendarProvider && updatedItem.accountProvider !== NylasVirtualCalendarProvider) {
            updatedItem.isDeleted = true
          }

          return updatedItem
        }

        // if we are updating existent calendar, then update it
        return { ...item, ...data.calendar }
      })

      // add new calendar to the list updated list or just use updated list
      updatePayload.nylasCalendars = calendarIndexInUserMeetingSettings === -1 ? [...updatedNylasCalendarsArray, data.calendar] : updatedNylasCalendarsArray
    }

    const updateUserMeetingSettingsResponse = await UserMeetingSettings.update(updatePayload, { where: { id: userMeetingSettings.id }, returning: true, transaction })
    userMeetingSettings = updateUserMeetingSettingsResponse[1][0].dataValues
  }

  return userMeetingSettings
}
syncUserMeetingsSettings.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  data: {
    id: Joi.string().uuid().required(),
    defaultAvailableTime: Joi.array().items(
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
      })
    ),
    defaultTimezone: Joi.string().allow(null),
    calendar: Joi.object().keys({
      id: Joi.string().required(),
      calendarId: Joi.string().required().allow(null),
      email: Joi.string().required(),
      accountId: Joi.string().required(),
      accessToken: Joi.string().required(),
      accountProvider: Joi.string().required(),
      isDeleted: Joi.bool().required(),
      isPrimary: Joi.bool().required()
    })
  },
  transaction: Joi.object()
})

/**
 * Handle connect calendar callback
 *
 * @param {*} reqQuery containing state, code &/or error
 * @returns The url that the user should be redirected to
 */
async function handleConnectCalendarCallback (reqQuery) {
  // we force "calendar.created" webhook to wait until UserMeetingSettings records with "accountId" is created
  // otherwise there could be a race condition and "calendar.created" this method started running,
  // but UserMeetingSettings with "accountId" is not yet in DB
  return runExclusiveCalendarConnectionHandler(async () => {
    let errorReason = reqQuery.error

    // verifying jwt token for request query param - 'state'
    const verifyQueryStateJwt = await jwt.verify(reqQuery.state, config.NYLAS_CONNECT_CALENDAR_JWT_SECRET, (err, decoded) => {
      if (err) {
        // if we cannot decode state, and there is already some error provided by Nylas, then return that error
        if (errorReason) {
          throw new Error(`Could not verify JWT token: ${errorReason}`)
        } else {
          throw new errors.UnauthorizedError(`Could not verify JWT token: ${JSON.stringify(err)}`)
        }
      }

      return decoded
    })

    // note userId is actually the UUID in the following line. not to confuse with other 'userId'
    const { userId, redirectTo } = verifyQueryStateJwt

    let urlToRedirect

    // if Nylas sent error when connecting calendar
    if (errorReason) {
      urlToRedirect = `${redirectTo}&calendarConnected=false&error=${encodeURIComponent(errorReason)}`
      return urlToRedirect
    }

    try {
      // getting user's accessToken from Nylas using 'code' found in request query
      const { accessToken, accountId, provider, email } = await NylasService.getAccessToken(reqQuery.code)
      // view https://developer.nylas.com/docs/api/#post/oauth/token for error response schema
      if (!accessToken || !accountId) {
        throw new errors.BadRequestError('Error getting access token for the calendar.')
      }

      // When user connect their calendar to the Nylas the first time, it takes time for Nylas to sync that calendar into Nylas
      // So if from the first attempt we haven't found the connected calendar, then we try several times after some delay
      const primaryCalendar = await NylasService.getPrimaryCalendar(accessToken)
      if (!primaryCalendar) {
        logger.debug({
          component: 'InterviewService',
          context: 'handleConnectCalendarCallback',
          message: `Could not get connected calendar id for account "${accountId}" email "${email}" provider "${provider}". Proceeding without calendar id for now...`
        })
      }

      const calendarId = primaryCalendar ? primaryCalendar.id : null

      const calendar = {
        id: uuid(), // internal UUID
        calendarId, // would be `null` if calendar was not retrieved from Nylas yet
        accountId,
        accessToken,
        accountProvider: provider,
        email,
        isPrimary: true,
        isDeleted: false
      }

      // as a current user use the user who is connecting the calendar
      // NOTE, that we cannot use `userId` because it's UUID, while in
      // `currentUser` we need to have integer user id
      const currentUser = _.pick(await helper.getUserDetailsByUserUUID(userId), ['userId', 'handle'])

      await syncUserMeetingsSettings(
        currentUser,
        {
          id: userId,
          calendar
        }
      )
    } catch (err) {
      errorReason = encodeURIComponent(err.message)
    } finally {
      urlToRedirect = `${redirectTo}&calendarConnected=true`

      if (errorReason) {
        urlToRedirect = `${redirectTo}&calendarConnected=false&error=${encodeURIComponent(errorReason)}`
      }
    }

    return urlToRedirect
  })
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
    const userMeetingSettings = await getUserMeetingSettingsByUserId(currentUser, reqParams.userId, false, { shouldNotStripUnwantedData: true })

    const calendarToDelete = _.find(userMeetingSettings.nylasCalendars, (item) => item.id === reqParams.calendarId)
    // error if no calendar found with the given id in request param
    if (!calendarToDelete) {
      throw new errors.NotFoundError(`Calendar with id "${reqParams.calendarId}" not found in UserMeetingSettings record.`)
    }
  } catch (err) {
    throw new errors.BadRequestError(err.message)
  }
}

deleteUserCalendar.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  reqParams: Joi.object().keys({
    userId: Joi.string().required(),
    calendarId: Joi.string().required()
  }).required()
}).required()

module.exports = {
  getUserMeetingSettingsByUserId,
  syncUserMeetingsSettings,
  handleConnectCalendarCallback,
  deleteUserCalendar
}
