/**
 * This service provides operations of Interview.
 */

const _ = require('lodash')
const Joi = require('joi')
const moment = require('moment')
const config = require('config')
const { Op, ForeignKeyConstraintError } = require('sequelize')
const { v4: uuid } = require('uuid')
const { createHash } = require('crypto')
const { Interviews: InterviewConstants, ZoomLinkType } = require('../../app-constants')
const helper = require('../common/helper')
const logger = require('../common/logger')
const errors = require('../common/errors')
const models = require('../models')

const sequelize = models.sequelize
const Interview = models.Interview
const UserMeetingSettings = models.UserMeetingSettings
const {
  createSchedulingPage,
  createVirtualCalendarForUser,
  patchSchedulingPage
} = require('./NylasService')
const {
  updateEvent
} = require('./NylasService')
const UserMeetingSettingsService = require('./UserMeetingSettingsService')
const { runExclusiveInterviewEventHandler } = require('../common/helper')
const { getZoomMeeting } = require('./ZoomService')

// Each request made by Nylas in the partiallyUpdateInterviewByWebhook endpoint
// includes a SHA256 hash of a secret (stored in env variable) to be sent in the
// request param. Verifying this hash lets us authenticate the request.
function verifyNylasWebhookRequest (authToken) {
  const digest = createHash('sha256')
    .update(config.NYLAS_SCHEDULER_WEBHOOK_SECRET)
    .digest('hex')

  return digest === authToken
}

/**
  * Ensures user is permitted for the operation.
  *
  * @param {Object} currentUser the user who perform this operation.
  * @param {String} jobCandidateId the job candidate id
  * @param {Boolean} allowCandidate will allow also the currentUser to access if is a candidate
  * @throws {errors.ForbiddenError}
  */
async function ensureUserIsPermitted (currentUser, jobCandidateId, allowCandidate = false) {
  if (!currentUser.hasManagePermission && !currentUser.isMachine) {
    const jobCandidate = await models.JobCandidate.findById(jobCandidateId)
    const job = await jobCandidate.getJob()
    try {
      await helper.checkIsMemberOfProject(currentUser.userId, job.projectId)
    } catch (error) {
      if (error instanceof errors.UnauthorizedError) {
        if (allowCandidate === true) {
          const userId = await helper.getUserId(currentUser.userId)
          if (userId === jobCandidate.userId) {
            return
          }
        }
      }
      throw new errors.ForbiddenError('You are not allowed to perform this action!')
    }
  }
}

/**
 * Handles common sequelize errors
 * @param {Object} err error
 * @param {String} jobCandidateId the job candidate id
 */
function handleSequelizeError (err, jobCandidateId) {
  // jobCandidateId doesn't exist - gracefully handle
  if (err instanceof ForeignKeyConstraintError || err instanceof errors.NotFoundError) {
    throw new errors.NotFoundError(
          `The job candidate with id=${jobCandidateId} doesn't exist.`
    )
  }
  // another type of sequelize error - extract the details and throw
  const errDetail = _.get(err, 'original.detail')
  if (errDetail) {
    throw new errors.BadRequestError(errDetail)
  }
}

/**
 * Get interview by round
 * @param {Object} currentUser the user who perform this operation.
 * @param {String} jobCandidateId the job candidate id
 * @param {Number} round the interview round
 * @param {Boolean} fromDb flag if query db for data or not
 * @returns {Object} the interview
 */
async function getInterviewByRound (currentUser, jobCandidateId, round, fromDb = false) {
  // check permission
  await ensureUserIsPermitted(currentUser, jobCandidateId, true)
  // either ES query failed or `fromDb` is set - fallback to DB
  logger.info({ component: 'InterviewService', context: 'getInterviewByRound', message: 'try to query db for data' })

  const interview = await Interview.findOne({
    where: { jobCandidateId, round }
  })
  // throw NotFound error if doesn't exist
  if (!!interview !== true) {
    throw new errors.NotFoundError(`Interview doesn't exist with jobCandidateId: ${jobCandidateId} and round: ${round}`)
  }

  return interview.dataValues
}

getInterviewByRound.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  jobCandidateId: Joi.string().uuid().required(),
  round: Joi.number().integer().positive().required(),
  fromDb: Joi.boolean()
}).required()

/**
 * Get interview by id
 * @param {Object} currentUser the user who perform this operation.
 * @param {String} id the interview
 * @param {Boolean} fromDb flag if query db for data or not
 * @returns {Object} the interview
 */
async function getInterviewById (currentUser, id, fromDb = false) {
  // either ES query failed or `fromDb` is set - fallback to DB
  logger.info({ component: 'InterviewService', context: 'getInterviewById', message: 'try to query db for data' })
  const interview = await Interview.findOne({
    where: {
      [Op.or]: [
        { id }
      ]
    }
  })
  // throw NotFound error if doesn't exist
  if (!!interview !== true) {
    throw new errors.NotFoundError(`Interview doesn't exist with id: ${id}`)
  }
  // check permission before returning
  await ensureUserIsPermitted(currentUser, interview.jobCandidateId, true)

  return interview.dataValues
}

getInterviewById.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  id: Joi.string().required(),
  fromDb: Joi.boolean()
}).required()

/**
 * Request interview
 * @param {Object} currentUser the user who perform this operation
 * @param {String} jobCandidateId the job candidate id
 * @param {Object} interview the interview to be created
 * @returns {Object} the created/requested interview
 */
async function requestInterview (currentUser, jobCandidateId, interview) {
  // check permission
  await ensureUserIsPermitted(currentUser, jobCandidateId)

  // if M2M require hostUserId
  if (currentUser.isMachine) {
    const hostUserIdValidator = Joi.string().uuid().required()
    const { error } = hostUserIdValidator.validate(interview.hostUserId)
    if (error) {
      throw new errors.BadRequestError(`interview.hostUserId ${interview.hostUserId} is required and must be a valid uuid`)
    }
  }

  // find the round count
  const round = await Interview.count({
    where: { jobCandidateId }
  })

  // throw error if candidate has already had MaxAllowedCount interviews
  if (round >= InterviewConstants.MaxAllowedCount) {
    throw new errors.ConflictError(`You've reached the maximum allowed number (${InterviewConstants.MaxAllowedCount}) of interviews for this candidate.`)
  }

  // pre-populate fields
  interview.id = uuid()
  interview.expireTimestamp = moment().add(config.INTERVIEW_SCHEDULING_EXPIRE_TIME)

  interview.jobCandidateId = jobCandidateId
  interview.round = round + 1
  interview.createdBy = await helper.getUserId(currentUser.userId)

  if (_.isNil(interview.hostUserId) || interview.hostUserId === '') {
    interview.hostUserId = interview.createdBy
  }

  let entity
  let jobCandidateEntity
  let calendar
  try {
    await sequelize.transaction(async (t) => {
      // get calendar if exists, otherwise create a virtual one for the user
      const existentCalendar = await UserMeetingSettings.getPrimaryNylasCalendarForUser(interview.hostUserId)
      if (_.isNil(existentCalendar)) {
        const { email, firstName, lastName } = await helper.getUserDetailsByUserUUID(interview.hostUserId)
        const currentUserFullname = `${firstName} ${lastName}`
        calendar = await createVirtualCalendarForUser(interview.hostUserId, email, currentUserFullname, interview.hostTimezone)
        // make the new calendar primary
        calendar.isPrimary = true
      } else {
        calendar = existentCalendar
      }

      // if primary calendar doesn't have `calendarId`
      if (!calendar.calendarId) {
        throw errors.BadRequestError(`Cannot schedule interview using calendar "${calendar.email}" as it was not fully connected. Try waiting a couple of minutes, removing or reconnecting the calendar.`)
      }

      // configure scheduling page
      const jobCandidate = await models.JobCandidate.findById(interview.jobCandidateId)
      const job = await jobCandidate.getJob()
      const pageOptions = {
        eventTitle: `Job Interview for "${job.title}"`
      }
      // create scheduling page on nylas
      let schedulingPage
      try {
        schedulingPage = await createSchedulingPage(interview, calendar, pageOptions)
        logger.debug(`requestInterview -> createSchedulingPage created: ${JSON.stringify(schedulingPage)}, using accessToken: "${calendar.accessToken}"`)
      } catch (err) {
        logger.error(`requestInterview -> createSchedulingPage failed: ${err.toString()}, using accessToken: "${calendar.accessToken}"`)
        throw err
      }

      // Link nylasPage to interview
      interview.nylasPageId = schedulingPage.id
      interview.nylasPageSlug = schedulingPage.slug
      interview.nylasCalendarId = calendar.calendarId

      // status handling will be implemented in another challenge it seems, setting the default value
      interview.status = InterviewConstants.Status.Scheduling

      try {
        await UserMeetingSettingsService.syncUserMeetingsSettings(
          currentUser,
          {
            id: interview.hostUserId,
            // when scheduling a new interview we always set/update default available time and timezone
            defaultAvailableTime: interview.availableTime,
            defaultTimezone: interview.hostTimezone,
            // don't add calendar if we use existent one
            calendar: !existentCalendar ? calendar : undefined
          },
          t
        )
      } catch (err) {
        logger.debug(`requestInterview -> syncUserMeetingsSettings ERROR: ${JSON.stringify(err)}`)
        throw err
      }
      // create the interview
      const created = await Interview.create(interview, { transaction: t })
      entity = created.toJSON()

      // update jobCandidate.status to Interview
      const [, affectedRows] = await models.JobCandidate.update(
        { status: 'interview' },
        { where: { id: created.jobCandidateId }, returning: true, transaction: t }
      )
      jobCandidateEntity = _.omit(_.get(affectedRows, '0.dataValues'), 'deletedAt')
    })
  } catch (err) {
    if (entity) {
      helper.postErrorEvent(config.TAAS_ERROR_TOPIC, entity, 'interview.request')
    }
    // gracefully handle if one of the common sequelize errors
    handleSequelizeError(err, jobCandidateId)
    // if reaches here, it's not one of the common errors handled in `handleSequelizeError`
    throw err
  }
  await helper.postEvent(config.TAAS_INTERVIEW_REQUEST_TOPIC, entity)
  await helper.postEvent(config.TAAS_JOB_CANDIDATE_UPDATE_TOPIC, jobCandidateEntity)
  // return created interview
  return entity
}

requestInterview.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  jobCandidateId: Joi.string().uuid().required(),
  interview: Joi.object().keys({
    duration: Joi.number().integer().positive().required(),
    hostTimezone: Joi.string().required(),
    hostUserId: Joi.string().uuid(),
    expireTimestamp: Joi.date(),
    availableTime: Joi.array().min(1).items(
      Joi.object({
        days: Joi.array().max(7).items(Joi.string().valid(
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
    ).required()
  }).required()
}).required()

/**
 * Updates interview
 *
 * @param {Object} currentUser user who performs the operation
 * @param {Object} interview the existing interview object
 * @param {Object} data object containing updated fields
 * @returns {Object} updated interview
 */
async function partiallyUpdateInterview (currentUser, interview, data) {
  const oldInterviewValue = interview.toJSON()
  // only status can be updated for Completed interviews
  if (interview.status === InterviewConstants.Status.Completed) {
    const updatedFields = _.keys(data)
    if (updatedFields.length !== 1 || !_.includes(updatedFields, 'status')) {
      throw new errors.BadRequestError('Only the "status" can be updated for Completed interviews.')
    }
  }

  // automatically set endTimestamp if startTimestamp is provided
  if (data.startTimestamp && !!data.endTimestamp !== true) {
    data.endTimestamp = moment(data.startTimestamp).add(interview.duration, 'minutes').toDate()
  }

  data.updatedBy = await helper.getUserId(currentUser.userId)
  let entity
  try {
    await sequelize.transaction(async (t) => {
      // check if  "duration", "availableTime" or "hostTimezone" changed. In that case we need to keep nylas consistent
      if (interview.duration !== data.duration || interview.availableTime !== data.availableTime || interview.hostTimezone !== data.hostTimezone) {
        const settingsForCalendar = await UserMeetingSettings.findOne({
          where: {
            nylasCalendars: {
              [Op.contains]: [{ calendarId: interview.nylasCalendarId }]
            }
          }
        })
        const nylasAccessToken = _.find(settingsForCalendar.nylasCalendars, { calendarId: interview.nylasCalendarId }).accessToken

        await patchSchedulingPage(interview.nylasPageId, nylasAccessToken, {
          duration: interview.duration !== data.duration ? data.duration : null,
          availableTime: interview.availableTime !== data.availableTime ? data.availableTime : null,
          timezone: interview.hostTimezone !== data.hostTimezone ? data.hostTimezone : null
        })
      }

      entity = (await interview.update(data, { transaction: t })).toJSON()
    })
  } catch (err) {
    if (entity) {
      helper.postErrorEvent(config.TAAS_ERROR_TOPIC, entity, 'interview.update')
    }
    // gracefully handle if one of the common sequelize errors
    handleSequelizeError(err, interview.jobCandidateId)
    // if reaches here, it's not one of the common errors handled in `handleSequelizeError`
    throw err
  }
  await helper.postEvent(config.TAAS_INTERVIEW_UPDATE_TOPIC, entity, { oldValue: oldInterviewValue })
  return entity
}

/**
 * Patch (partially update) interview by round
 * @param {Object} currentUser the user who perform this operation
 * @param {String} jobCandidateId the job candidate id
 * @param {Number} round the interview round
 * @param {Object} data object containing patched fields
 * @returns {Object} the patched interview object
 */
async function partiallyUpdateInterviewByRound (currentUser, jobCandidateId, round, data) {
  const interview = await Interview.findOne({
    where: {
      jobCandidateId, round
    }
  })
  // throw NotFound error if doesn't exist
  if (!!interview !== true) {
    throw new errors.NotFoundError(`Interview doesn't exist with jobCandidateId: ${jobCandidateId} and round: ${round}`)
  }
  // check permission
  await ensureUserIsPermitted(currentUser, jobCandidateId)

  return await partiallyUpdateInterview(currentUser, interview, data)
}

partiallyUpdateInterviewByRound.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  jobCandidateId: Joi.string().uuid().required(),
  round: Joi.number().integer().positive().required(),
  data: Joi.object().keys({
    duration: Joi.number().integer().positive(),
    hostTimezone: Joi.string(),
    hostUserId: Joi.string().uuid(),
    expireTimestamp: Joi.date(),
    availableTime: Joi.array().min(1).items(
      Joi.object({
        days: Joi.array().max(7).items(Joi.string().valid(
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
    startTimestamp: Joi.date().greater('now').when('status', {
      is: [InterviewConstants.Status.Scheduled, InterviewConstants.Status.Rescheduled],
      then: Joi.invalid(null),
      otherwise: Joi.allow(null)
    }),
    endTimestamp: Joi.date().greater(Joi.ref('startTimestamp')).when('status', {
      is: [InterviewConstants.Status.Scheduled, InterviewConstants.Status.Rescheduled],
      then: Joi.invalid(null),
      otherwise: Joi.allow(null)
    }),
    status: Joi.interviewStatus(),
    deletedAt: Joi.date().allow(null)
  }).required().min(1) // at least one key - i.e. don't allow empty object
}).required()

/**
 * Patch (partially update) interview by id
 * @param {Object} currentUser the user who perform this operation
 * @param {String} id the interview
 * @param {Object} data object containing patched fields
 * @returns {Object} the patched interview object
 */
async function partiallyUpdateInterviewById (currentUser, id, data) {
  return internallyUpdateInterviewById(currentUser, id, data)
}

partiallyUpdateInterviewById.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  id: Joi.string().required(),
  data: Joi.object().keys({
    duration: Joi.number().integer().positive(),
    hostTimezone: Joi.string(),
    hostUserId: Joi.string().uuid(),
    expireTimestamp: Joi.date(),
    availableTime: Joi.array().min(1).items(
      Joi.object({
        days: Joi.array().max(7).items(Joi.string().valid(
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
    startTimestamp: Joi.date().greater('now').when('status', {
      is: [InterviewConstants.Status.Scheduled, InterviewConstants.Status.Rescheduled],
      then: Joi.invalid(null),
      otherwise: Joi.allow(null)
    }),
    endTimestamp: Joi.date().greater(Joi.ref('startTimestamp')).when('status', {
      is: [InterviewConstants.Status.Scheduled, InterviewConstants.Status.Rescheduled],
      then: Joi.invalid(null),
      otherwise: Joi.allow(null)
    }),
    status: Joi.interviewStatus(),
    deletedAt: Joi.date().allow(null)
  }).required().min(1) // at least one key - i.e. don't allow empty object
}).required()

/**
 * Patch (partially update) interview by id
 *
 * The same as `partiallyUpdateInterviewById` but without validation for internal usage.
 *
 * @param {Object} currentUser the user who perform this operation
 * @param {String} id the interview
 * @param {Object} data object containing patched fields
 * @returns {Object} the patched interview object
 */
async function internallyUpdateInterviewById (currentUser, id, data) {
  const interview = await Interview.findOne({
    where: {
      [Op.or]: [
        { id }
      ]
    }
  })
  // throw NotFound error if doesn't exist
  if (!!interview !== true) {
    throw new errors.NotFoundError(`Interview doesn't exist with id: ${id}`)
  }
  // check permission
  await ensureUserIsPermitted(currentUser, interview.jobCandidateId)

  return await partiallyUpdateInterview(currentUser, interview, data)
}

/**
 * List interviews
 * @param {Object} currentUser the user who perform this operation.
 * @param {String} jobCandidateId the job candidate id
 * @param {Object} criteria the search criteria
 * @returns {Object} the search result, contain total/page/perPage and result array
 */
async function searchInterviews (currentUser, jobCandidateId, criteria) {
  // check permission
  await ensureUserIsPermitted(currentUser, jobCandidateId, true)

  const { page, perPage } = criteria

  logger.info({ component: 'InterviewService', context: 'searchInterviews', message: 'fallback to DB query' })
  const filter = {
    [Op.and]: [{ jobCandidateId }]
  }
  // apply filtering based on criteria
  _.each(_.pick(criteria, ['status', 'createdAt', 'updatedAt']), (value, key) => {
    filter[Op.and].push({ [key]: value })
  })
  const interviews = await Interview.findAll({
    where: filter,
    offset: ((page - 1) * perPage),
    limit: perPage,
    order: [[criteria.sortBy, criteria.sortOrder]]
  })
  const total = await Interview.count({ where: filter })
  return {
    fromDb: true,
    total,
    page,
    perPage,
    result: _.map(interviews, interview => interview.dataValues)
  }
}

searchInterviews.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  jobCandidateId: Joi.string().uuid().required(),
  criteria: Joi.object().keys({
    page: Joi.page(),
    perPage: Joi.perPage(),
    sortBy: Joi.string().valid('round', 'createdAt', 'updatedAt').default('createdAt'),
    sortOrder: Joi.string().valid('desc', 'asc').default('desc'),
    createdAt: Joi.date(),
    updatedAt: Joi.date(),
    status: Joi.interviewStatus()
  }).required()
}).required()

/**
 * Updates the status of completed (based on startTimestamp) interviews.
 * If the startTimestamp of an interview is less than (or equal) the (currentDateTime - 1 hour)
 * it's considered as completed.
 */
async function updateCompletedInterviews () {
  logger.info({ component: 'InterviewService', context: 'updateCompletedInterviews', message: 'Running the scheduled job...' })
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

  let entity
  let affectedCount
  try {
    await sequelize.transaction(async (t) => {
      const updated = await Interview.update(
        // '00000000-0000-0000-0000-000000000000' - to indicate it's updated by the system job
        { status: InterviewConstants.Status.Completed, updatedBy: '00000000-0000-0000-0000-000000000000' },
        {
          where: {
            status: [InterviewConstants.Status.Scheduled, InterviewConstants.Status.Rescheduled],
            startTimestamp: {
              [Op.lte]: oneHourAgo
            }
          },
          returning: true,
          transaction: t
        }
      )
      // eslint-disable-next-line no-unused-vars
      let updatedRows
      [affectedCount, updatedRows] = updated

      // post event if there are affected/updated interviews
      if (affectedCount > 0) {
        // payload format:
        // {
        //   jobCandidateId: { interviewId: { affectedFields }, interviewId2: { affectedFields }, ... },
        //   jobCandidateId2: { interviewId: { affectedFields }, interviewId2: { affectedFields }, ... },
        //   ...
        // }
        const bulkUpdatePayload = {}
        // construct payload
        _.forEach(updatedRows, row => {
          const interview = row.toJSON()
          const affectedFields = _.pick(interview, ['status', 'updatedBy', 'updatedAt'])
          _.set(bulkUpdatePayload, [interview.jobCandidateId, interview.id], affectedFields)
        })
        entity = bulkUpdatePayload
      }
    })
  } catch (e) {
    if (entity) {
      helper.postErrorEvent(config.TAAS_ERROR_TOPIC, entity, 'interview.bulkupdate')
    }
    throw e
  }
  if (affectedCount) {
    // post event
    await helper.postEvent(config.TAAS_INTERVIEW_BULK_UPDATE_TOPIC, entity)
  }

  logger.info({ component: 'InterviewService', context: 'updateCompletedInterviews', message: `Completed running. Updated ${affectedCount} interviews.` })
}

/**
 * Update interview using received webhook data
 *
 * This method would be always called when someone selects time for new interview using Nylas Page.
 * This would NOT be called when make updates to the events or cancel them, only when we create event as per Nylas logic.
 *
 * @param {String} interviewId interview id
 * @param {Object} webhookBody webhook body
 * @returns nothing
 */
async function partiallyUpdateInterviewByWebhook (interviewId, authToken, webhookBody) {
  // don't await for response to prevent gateway timeout because it might wait for mutex to release
  // we use mutex here, otherwise we might update the same interview using `NylasWebhookService`
  // and there maybe race condition when updating the same record
  runExclusiveInterviewEventHandler(async () => {
    logger.debug({ component: 'InterviewService', context: 'partiallyUpdateInterviewByWebhook', message: `Mutex: processing webhook for interview id "${interviewId}": ${JSON.stringify(webhookBody)}` })

    // Verify the request to make sure it's actually from Nylas.
    if (!verifyNylasWebhookRequest(authToken)) {
      logger.error({
        component: 'InterviewService',
        context: 'partiallyUpdateInterviewByWebhook',
        message: `Failed to verify Nylas webhook request authToken: ${authToken}`
      })

      throw new errors.UnauthorizedError('Webhook request failed verification.')
    }

    // this method is used by the Nylas webhooks, so use M2M user
    const m2mUser = helper.getAuditM2Muser()
    const { page: pageDetails, booking: bookingDetails } = webhookBody
    const interviewStartTimeMoment = moment.unix(bookingDetails.start_time)
    const interviewEndTimeMoment = moment.unix(bookingDetails.end_time)

    if (bookingDetails.is_confirmed) {
      try {
        // get the associated interview
        const interview = await Interview.findById(interviewId)

        // Nylas might create multiple events for the same booking, so we have to only listen for the event inside calendar which was used for interview booking
        if (interview.nylasCalendarId !== bookingDetails.calendar_id) {
          logger.debug({
            component: 'InterviewService',
            context: 'partiallyUpdateInterviewByWebhook',
            message: `Skipping event "${bookingDetails.calendar_event_id}" for interview "${interviewId}" because event calendar "${bookingDetails.calendar_id}" doesn't match interview calendar "${interview.nylasCalendarId}".`
          })
          return
        }

        const userMeetingSettingsForCalendar = await UserMeetingSettings.findOne({
          where: {
            nylasCalendars: {
              [Op.contains]: [{ calendarId: bookingDetails.calendar_id }]
            }
          }
        })

        if (!userMeetingSettingsForCalendar) {
          throw new errors.BadRequestError('Error getting UserMeetingSettings for the booking calendar id.')
        }

        const accessToken = _.find(userMeetingSettingsForCalendar.nylasCalendars, { calendarId: bookingDetails.calendar_id }).accessToken

        // Interview cancel/reschedule links
        const cancelInterviewLink = `${config.TAAS_APP_BASE_URL}/interview/${interviewId}/cancel`
        const rescheduleInterviewLink = `${config.TAAS_APP_BASE_URL}/interview/${interviewId}/reschedule`

        // update events endpoint only takes stringified values for any key in metadata
        const pageId = pageDetails && pageDetails.id ? pageDetails.id.toString() : ''
        const pageSlug = (pageDetails && pageDetails.slug) || ''
        const eventDescription = `\n\nTo make changes to this event, click the links below:\n\nReschedule: ${rescheduleInterviewLink}\nCancel: ${cancelInterviewLink}`

        const updateEventData = {
          description: eventDescription,
          metadata: {
            interviewId,
            pageId,
            pageSlug
          }
        }

        // update the Nylas event to set custom metadata
        await updateEvent(bookingDetails.calendar_event_id, updateEventData, accessToken)

        await internallyUpdateInterviewById(
          m2mUser,
          interviewId,
          {
            status: InterviewConstants.Status.Scheduled,
            startTimestamp: interviewStartTimeMoment.toDate(),
            endTimestamp: interviewEndTimeMoment.toDate(),
            // additionally `nylasEventId` would be always set inside NylasWebhookService to make sure it always happens before cancelling
            nylasEventId: bookingDetails.calendar_event_id,
            nylasEventEditHash: bookingDetails.edit_hash,
            guestTimezone: interview.guestTimezone || bookingDetails.recipient_tz
          }
        )

        logger.debug({
          component: 'InterviewService',
          context: 'partiallyUpdateInterviewByWebhook',
          message: `Interview scheduled by event "${bookingDetails.calendar_event_id}" in calendar "${bookingDetails.calendar_id}" for account "${bookingDetails.account_id}" on ${interviewStartTimeMoment.format('MMM DD YYYY HH:mm')}`
        })
      } catch (err) {
        logger.logFullError(err, { component: 'InterviewService', context: 'partiallyUpdateInterviewByWebhook' })
        throw new errors.BadRequestError(`Could not update interview: ${err.message}`)
      }
    }
  }).then(() => {
    logger.debug({
      component: 'InterviewService',
      context: 'partiallyUpdateInterviewByWebhook',
      message: 'Mutex: released'
    })
  }).catch((err) => {
    logger.logFullError(`Mutex: error "${err.toString()}".`, { component: 'InterviewService', context: 'partiallyUpdateInterviewByWebhook' })
  })
}
partiallyUpdateInterviewByWebhook.schema = Joi.object().keys({
  interviewId: Joi.string().uuid().required(),
  authToken: Joi.string().required(),
  webhookBody: Joi.object().invalid({}).required()
}).required()

/**
 * Get zoom link.
 *
 * @param {String} interviewId the interview id
 * @param {Object} data the request query data
 * @returns zoom link
 */
async function getZoomLink (interviewId, data) {
  const { type, id } = helper.verifyZoomLinkToken(data.token)
  if (data.type !== type || interviewId !== id) {
    throw new errors.BadRequestError('Invalid type or id.')
  }
  const interview = await Interview.findById(interviewId)

  // check if the interview zoom link is not expired
  const { Completed, Cancelled, Expired } = InterviewConstants.Status
  if (_.includes([Completed, Cancelled, Expired], interview.status)) {
    throw new errors.BadRequestError(`Zoom link is no longer available for this interview because the current status of the interview is "${interview.status}".`)
  }
  const zoomMeeting = await getZoomMeeting(interview.zoomAccountApiKey, interview.zoomMeetingId)
  if (data.type === ZoomLinkType.HOST) {
    return zoomMeeting.start_url
  } else if (data.type === ZoomLinkType.GUEST) {
    return zoomMeeting.join_url
  }
}

getZoomLink.schema = Joi.object().keys({
  interviewId: Joi.string().uuid().required(),
  data: Joi.object().keys({
    type: Joi.string().valid(ZoomLinkType.HOST, ZoomLinkType.GUEST).required(),
    token: Joi.string().required()
  }).required()
}).required()

module.exports = {
  getInterviewByRound,
  getInterviewById,
  requestInterview,
  partiallyUpdateInterviewByRound,
  partiallyUpdateInterviewById,
  internallyUpdateInterviewById,
  searchInterviews,
  updateCompletedInterviews,
  partiallyUpdateInterviewByWebhook,
  getZoomLink
}
