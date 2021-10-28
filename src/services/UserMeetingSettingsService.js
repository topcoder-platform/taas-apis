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
  processCreateOrUpdate,
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
    const availableCalendars = _.filter(userMeetingSettings.nylasCalendars, (item) => {
      if (!item.isDeleted) {
        return _.omit(item, ['accessToken', 'accountId'])
      }
    })

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
  if (!fromDb) {
    try {
      // get user meeting settings from ES
      const userMeetingSettingsES = await esClient.get({
        index: config.esConfig.ES_INDEX_USER_MEETING_SETTINGS,
        id: userId
      })
      // extract interviews from ES object
      const userMeetingSettings = _.get(userMeetingSettingsES, 'body._source')
      if (userMeetingSettings) {
        return handleUserMeetingSettingsData(userMeetingSettings, options.shouldNotStripUnwantedData)
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

  return handleUserMeetingSettingsData(userMeetingSettings, options.shouldNotStripUnwantedData)
}
getUserMeetingSettingsByUserId.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  userId: Joi.string().uuid().required(),
  fromDb: Joi.boolean(),
  options: Joi.object().keys({
    shouldNotStripUnwantedData: Joi.boolean()
  })
}).required()

/**
 * Create UserMeetingSettings if it doesn't exist
 *
 * @param {Object} currentUser current user object
 * @param {Object} data UserMeetingSettings record data
 * @param {Object} transaction transaction
 * @returns {Object} existent or created UserMeetingSettings record
 */
async function createUserMeetingSettingsIfNotExisting (currentUser, data, transaction) {
  // check permission
  await ensureUserIsPermitted(currentUser, data.id)

  let userMeetingSettings = await UserMeetingSettings.findById(data.id, false)

  if (_.isNil(userMeetingSettings)) {
    data.createdBy = await helper.getUserId(currentUser.userId)

    userMeetingSettings = await UserMeetingSettings.create(data, { transaction: transaction })
    // we call method `createUserMeetingSettingsIfNotExisting` as part of complex logic with transaction
    // it might happen that some other logic fails, and transaction reverts
    // but records in ES would stay, and if just try to create it again, it would cause error
    // so we use a special method which would create if not exist or update if already exists
    await processCreateOrUpdate(userMeetingSettings.toJSON())
  }

  return userMeetingSettings
}
createUserMeetingSettingsIfNotExisting.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  data: {
    id: Joi.string().uuid().required(),
    nylasCalendars: Joi.array().items(
      Joi.object().keys({
        id: Joi.string().required(),
        accountId: Joi.string().required(),
        accessToken: Joi.string().required(),
        accountProvider: Joi.string().required(),
        isDeleted: Joi.bool().required(),
        isPrimary: Joi.bool().required()
      }).required()
    ).required(),
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
      }).required()
    ).required(),
    defaultTimezone: Joi.string()
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
  let errorReason = reqQuery.error

  // verifying jwt token for request query param - 'state'
  const verifyQueryStateJwt = await jwt.verify(reqQuery.state, config.NYLAS_CONNECT_CALENDAR_JWT_SECRET, (err, decoded) => {
    if (err) {
      // if we cannot decode state, and there is already some error provided by Nylas, then return that error
      if (errorReason) {
        throw new Error(errorReason)
      } else {
        throw new errors.UnauthorizedError('Could not verify JWT token.')
      }
    }

    return decoded
  })

  // note userId is actually the UUID in the following line. not to confuse with other 'userId'
  const { userId, redirectTo } = verifyQueryStateJwt

  let urlToRedirect

  // if Nylas sent error when connecting calendar
  if (errorReason) {
    urlToRedirect = `${redirectTo}&calendarConnected=false&error=${errorReason}`
    return urlToRedirect
  }

  try {
    // getting user's accessToken from Nylas using 'code' found in request query
    const { accessToken, accountId, provider } = await NylasService.getAccessToken(reqQuery.code)
    // view https://developer.nylas.com/docs/api/#post/oauth/token for error response schema
    if (!accessToken || !accountId) {
      throw new errors.BadRequestError('Error getting access token for the calendar.')
    }

    // getting user's all existing calendars
    const calendars = await NylasService.getExistingCalendars(accessToken)
    if (!Array.isArray(calendars) || calendars.length < 1) {
      throw new errors.BadRequestError('Error getting calendar data for the user.')
    }

    const primaryCalendar = await NylasService.getPrimaryCalendar(calendars)
    if (!primaryCalendar) {
      throw new errors.NotFoundError('Could not find any writable calendar.')
    }

    const calendarDetails = {
      accessToken,
      accountId,
      accountProvider: provider,
      id: primaryCalendar.id,
      isPrimary: true,
      isDeleted: false
    }

    // as a current user use the user who is connecting the calendar
    // NOTE, that we cannot use `userId` because it's UUID, while in
    // `currentUser` we need to have integer user id
    const currentUser = _.pick(await helper.getUserDetailsByUserUUID(userId), ['userId', 'handle'])

    let userMeetingSettings = await UserMeetingSettings.findById(userId, false)

    // reuse this method to create UserMeetingSettings object
    if (_.isNil(userMeetingSettings)) {
      userMeetingSettings = await createUserMeetingSettingsIfNotExisting(
        currentUser,
        {
          id: userId,
          nylasCalendars: [calendarDetails],
          defaultAvailableTime: [],
          defaultTimezone: primaryCalendar.timezone
        }
      )
    } else { // or just update calendar details in the exisiting object
      const calendarIndexInUserMeetingSettings = _.findIndex(userMeetingSettings.nylasCalendars, (item) => item.id === calendarDetails.id)

      // map Nylas calendar array and
      // if current item's index doesn't match with calendar index saved in UserMeetingSettings, make it non-primary
      // but if it matches, update the calendar with newer details (which also makes it primary & marks isDeleted = false)
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
    urlToRedirect = `${redirectTo}&calendarConnected=true`

    if (errorReason) {
      urlToRedirect = `${redirectTo}&calendarConnected=false&error=${errorReason}`
    }
  }

  return urlToRedirect
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
    } else {
      let newPrimaryCalendarSet = false
      // map all calenders and check if deleting calendar is primary
      const updatedCalendars = _.map(userMeetingSettings.nylasCalendars, (item) => {
        if (item.id === reqParams.calendarId) {
          return { ...item, isPrimary: false, isDeleted: true }
        } else {
          // check if deleting primary calendar in this endpoint call & if another calendar is not already set as primary,
          // if not, check the current iterating calendar is not already deleted
          // then make the current iterating calendar as primary & set newPrimaryCalendarSet = true
          if (calendarToDelete.isPrimary && !newPrimaryCalendarSet && !item.isDeleted) {
            newPrimaryCalendarSet = true
            return { ...item, isPrimary: true }
          }

          return item
        }
      })

      const updatePayload = {
        ...userMeetingSettings,
        nylasCalendars: updatedCalendars
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
