const config = require('config')
const { Interviews: { Status: InterviewStatus } } = require('../../app-constants')

const crypto = require('crypto')
const _ = require('lodash')
const moment = require('moment')
const { validate: uuidValidate } = require('uuid')
const { Op } = require('sequelize')

const logger = require('../common/logger')
const InterviewService = require('./InterviewService')
const NylasService = require('./NylasService')
const UserMeetingSettingsService = require('./UserMeetingSettingsService')
const { Interview, UserMeetingSettings } = require('../../src/models')
const helper = require('../common/helper')
const errors = require('../common/errors')

const localLogger = {
  debug: (message, context) =>
    logger.debug({ component: 'NylasWebhookService', context, message }),
  error: (message, context) =>
    logger.error({ component: 'NylasWebhookService', context, message }),
  info: (message, context) =>
    logger.info({ component: 'NylasWebhookService', context, message })
}

const EVENT_TYPE = {
  EVENT: {
    CREATED: 'event.created',
    UPDATED: 'event.updated',
    DELETED: 'event.deleted'
  },
  CALENDAR: {
    CREATED: 'calendar.created',
    UPDATED: 'calendar.updated',
    DELETED: 'calendar.deleted'
  }
}

const eventProcessors = {
  [EVENT_TYPE.EVENT.CREATED]: processEventCreatedWebhook,
  [EVENT_TYPE.EVENT.UPDATED]: processEventUpdatedWebhook,
  [EVENT_TYPE.CALENDAR.CREATED]: processCalendarCreatedWebhook
}

const getInterviewIdFromEvent = (event) => {
  // if we already update event description and added metadata, then use it to get interview id
  if (_.get(event, 'metadata.interviewId')) {
    return event.metadata.interviewId
  }

  if (!event.description) {
    throw new Error(`Cannot get interview id for event ${event.id} as it doesn't have description.`)
  }

  // if this is a new event and we haven't updated description yet, and haven't set metadata,
  // then parse description
  const matchIdOriginalDescription = event.description.match(/tc-taas-interview-([^/]+)/)
  const interviewIdFromOriginalDescription = matchIdOriginalDescription && matchIdOriginalDescription[1]
  if (uuidValidate(interviewIdFromOriginalDescription)) {
    return interviewIdFromOriginalDescription
  }

  // if this is a duplicate event which we are actually not interested in, then it would have update description, but not updated metadata
  // so we extract id from the updated description
  const matchIdUpdatedDescription = event.description.match(/taas\/interview\/([^/]+)/)
  const interviewIdFromUpdatedDescription = matchIdUpdatedDescription && matchIdUpdatedDescription[1]
  if (uuidValidate(interviewIdFromUpdatedDescription)) {
    return interviewIdFromUpdatedDescription
  }

  throw new Error(`Cannot get interview id for event ${event.id}.`)
}

/**
 * Process "event.created" webhook
 *
 * - associate created event with interview
 *
 * @param {Object} webhookData webhook data
 * @param {Number} webhookId webhook id for tracking
 */
async function processEventCreatedWebhook (webhookData, webhookId) {
  // start retrieving event immediately after getting webhook
  // but don't wait for it, the main code should be run inside mutex
  // to process all the webhooks in correct order
  const eventPromise = NylasService.getEvent(
    webhookData.object_data.account_id,
    webhookData.object_data.id
  ).then((event) => {
    localLogger.debug(`Got object details for webhook, type: ${webhookData.type}, status: ${event.status}, id: ${event.id}, event: ${JSON.stringify(event)}`, `processEventCreatedWebhook #webhook-${webhookId}`)

    return event
  }).catch((err) => {
    localLogger.error(err, `processEventCreatedWebhook #webhook-${webhookId}`)

    return null
  })
  // we have to use mutex here to support re-scheduling
  // otherwise when new event is created we might not yet update `nylasEventId`
  // and then we would accidentally cancel re-scheduled event
  await helper.runExclusiveInterviewEventHandler(async () => {
    localLogger.debug(`Mutex: acquired. Webhook type: "${webhookData.type}", object id: "${webhookData.object_data.id}", date: "${moment.unix(webhookData.date).utc().format()}"`, `processEventCreatedWebhook #webhook-${webhookId}`)
    try {
      const event = await eventPromise

      if (!event) {
        throw new errors.BadRequestError(`Could not get event "${webhookData.object_data.id}".`)
      }

      let interviewId
      try {
        interviewId = getInterviewIdFromEvent(event)
      } catch (err) {
        localLogger.debug(`Ignoring event "${event.id}" because cannot extract interview id from its description "${event.description}".`, `processEventCreatedWebhook #webhook-${webhookId}`)
        return
      }

      if (event.status === 'confirmed') {
        const interview = await Interview.findById(interviewId)
        if (!interview) {
          throw new errors.BadRequestError(`Could not find interview with given id: ${interviewId}`)
        }

        // Nylas might create multiple events for the same booking, so we have to only listen for the event inside calendar which was used for interview booking
        if (interview.nylasCalendarId !== event.calendar_id) {
          localLogger.debug(`Ignoring event "${event.id}" for interview "${interviewId}" because event calendar "${event.calendar_id}" doesn't match interview calendar "${interview.nylasCalendarId}".`, `processEventCreatedWebhook #webhook-${webhookId}`)
          return
        }

        // this method is used by the Nylas webhooks, so use M2M user
        const m2mUser = helper.getAuditM2Muser()

        await InterviewService.internallyUpdateInterviewById(
          m2mUser,
          interviewId,
          {
            nylasEventId: event.id
            // other fields would be updated inside `partiallyUpdateInterviewByWebhook`
          }
        )

        if (interview.nylasEventId) {
          localLogger.debug(`Interview with id "${interview.id}" has been re-assigned from Nylas event id "${interview.nylasEventId}" to "${event.id}".`, `processEventCreatedWebhook #webhook-${webhookId}`)
        } else {
          localLogger.debug(`Interview with id "${interview.id}" is now assigned to Nylas event id "${event.id}".`, `processEventCreatedWebhook #webhook-${webhookId}`)
        }
      } else {
        localLogger.debug(`ignoring event, type: ${webhookData.type}, status: ${event.status}, id: ${event.id}`, `processEventCreatedWebhook #webhook-${webhookId}`)
      }
    } catch (err) {
      localLogger.error(err, `processEventCreatedWebhook #webhook-${webhookId}`)
    }
  }).then(() => {
    localLogger.debug('Mutex: released.', `processEventCreatedWebhook #webhook-${webhookId}`)
  }).catch((err) => {
    localLogger.error(`Mutex: error "${err.toString()}".`, `processEventCreatedWebhook #webhook-${webhookId}`)
  })
}

/**
 * Process "event.updated" webhook
 *
 * - marks interview as cancelled when associated event is cancelled
 *
 * @param {Object} webhookData webhook data
 * @param {Number} webhookId webhook id for tracking
 */
async function processEventUpdatedWebhook (webhookData, webhookId) {
  const eventId = webhookData.object_data.id
  // start retrieving event immediately after getting webhook
  // but don't wait for it, the main code should be run inside mutex
  // to process all the webhooks in correct order
  const eventStatusPromise = NylasService.getEvent(
    webhookData.object_data.account_id,
    webhookData.object_data.id
  ).then((event) => {
    localLogger.debug(`Got object details for webhook, type: ${webhookData.type}, status: ${event.status}, id: ${event.id}, event: ${JSON.stringify(event)}`, `processEventUpdatedWebhook #webhook-${webhookId}`)

    // if we could get the event, then just return its status
    return event.status
  }).catch((err) => {
    // if we cannot load event from Nylas it means Nylas internally has deleted it
    // so we can treat this case as "cancelled" if previously it was us who created such an event
    if (err.httpStatus === 404) {
      return 'deleted'
    }

    localLogger.error(err, `processEventUpdatedWebhook #webhook-${webhookId}`)
    return null
  })
  // we have to use mutex here to support re-scheduling
  // otherwise when new event is created we might not yet update `nylasEventId`
  // and then we would accidentally cancel re-scheduled event
  await helper.runExclusiveInterviewEventHandler(async () => {
    localLogger.debug(`Mutex: acquired. Webhook type: "${webhookData.type}", object id: "${webhookData.object_data.id}", date: "${moment.unix(webhookData.date).utc().format()}"`, `processEventUpdatedWebhook #webhook-${webhookId}`)
    try {
      const eventStatus = await eventStatusPromise

      if (!eventStatus) {
        throw new errors.BadRequestError(`Could not determine event status for "${eventId}".`)
      }

      if (eventStatus === 'cancelled' || eventStatus === 'deleted') {
        // find interview associated with this event
        let interview
        try {
          interview = await Interview.findByNylasEventId(eventId)
          localLogger.debug(`Found interview "${interview.id}" associated with event "${eventId}".`, `processEventUpdatedWebhook #webhook-${webhookId}`)
        } catch (err) {
          localLogger.debug(`Ignoring event "${eventId}" because cannot find any interview associated with this event.`, `processEventUpdatedWebhook #webhook-${webhookId}`)
          return
        }

        if (interview.status === InterviewStatus.Cancelled) {
          localLogger.debug(`Ignoring event "${eventId}" for interview "${interview.id}" because this interview is already cancelled.`, `processEventUpdatedWebhook #webhook-${webhookId}`)
          return
        }

        // this method is used by the Nylas webhooks, so use M2M user
        const m2mUser = helper.getAuditM2Muser()

        await InterviewService.internallyUpdateInterviewById(
          m2mUser,
          interview.id,
          {
            status: InterviewStatus.Cancelled
          }
        )

        localLogger.debug(`Interview "${interview.id}" was canceled by webhook by "${eventStatus}" event "${eventId}".`, `processEventUpdatedWebhook #webhook-${webhookId}`)
      } else {
        localLogger.debug(`Ignoring event ${eventId}, status "${eventStatus}", type: ${webhookData.type}`, `processEventUpdatedWebhook #webhook-${webhookId}`)
      }
    } catch (err) {
      localLogger.error(err, `processEventUpdatedWebhook #webhook-${webhookId}`)
    }
  }).then(() => {
    localLogger.debug('Mutex: released.', `processEventCreatedWebhook #webhook-${webhookId}`)
  }).catch((err) => {
    localLogger.error(`Mutex: error "${err.toString()}".`, `processEventCreatedWebhook #webhook-${webhookId}`)
  })
}

/**
 * Process "calendar.created" webhook
 *
 * - save calendar id for created calendar if it wasn't saved before
 *
 * @param {Object} webhookData webhook data
 * @param {Number} webhookId webhook id for tracking
 */
async function processCalendarCreatedWebhook (webhookData, webhookId) {
  // wait for the end of `UserMeetingSettingsService.handleConnectCalendarCallback` is it's currently running
  await helper.waitForUnlockCalendarConnectionHandler(async () => {
    localLogger.debug(`Interview mutex unlocked. Processing webhook type: "${webhookData.type}", object id: "${webhookData.object_data.id}", date: "${moment.unix(webhookData.date).utc().format()}"`, `processCalendarCreatedWebhook #webhook-${webhookId}`)

    // as multiple calendars could come during short period of time
    // to keep the logic more predictable we process calendars one by one for the same account using mutex
    const mutexName = `mutex-webhook-calendar-for-account-${webhookData.object_data.account_id}`
    await helper.runExclusiveByNamedMutex(mutexName, async () => {
      localLogger.debug(`#${mutexName} Mutex: acquired. Processing webhook type: "${webhookData.type}", object id: "${webhookData.object_data.id}", date: "${moment.unix(webhookData.date).utc().format()}"`, `processCalendarCreatedWebhook #webhook-${webhookId}`)
      const userMeetingSettingsForCalendar = await UserMeetingSettings.findOne({
        where: {
          nylasCalendars: {
            [Op.contains]: [{ accountId: webhookData.object_data.account_id }]
          }
        }
      })

      if (!userMeetingSettingsForCalendar) {
        localLogger.debug(`Ignoring created calendar "${webhookData.object_data.id}" because there are no users who connected calendar with Nylas Account Id: "${webhookData.object_data.account_id}".`, `processCalendarCreatedWebhook #webhook-${webhookId}`)
        return
      }

      localLogger.debug(`Found user settings associated with created calendar: ${JSON.stringify(userMeetingSettingsForCalendar)}`, `processCalendarCreatedWebhook #webhook-${webhookId}`)

      const calendarRecord = _.find(userMeetingSettingsForCalendar.nylasCalendars, { accountId: webhookData.object_data.account_id })

      if (calendarRecord.calendarId) {
        localLogger.debug(`Ignoring created calendar "${webhookData.object_data.id}" because user already has calendar "${calendarRecord.calendarId}" for account "${calendarRecord.accountId}" email "${calendarRecord.email}".`, `processCalendarCreatedWebhook #webhook-${webhookId}`)
        return
      }

      const accessToken = calendarRecord.accessToken

      const calendar = await NylasService.getCalendar(webhookData.object_data.id, accessToken)

      localLogger.debug(`Got object details for webhook, type: ${webhookData.type}, id: ${calendar.id}, calendar: ${JSON.stringify(calendar)}`, `processCalendarCreatedWebhook #webhook-${webhookId}`)

      // check if loaded calendar could play role of a primary calendar
      const canBePrimary = !!(await NylasService.findPrimaryCalendar([calendar]))
      if (!canBePrimary) {
        localLogger.debug(`Ignoring read-only calendar "${webhookData.object_data.id}" for account "${calendarRecord.accountId}" email "${calendarRecord.email}".`, `processCalendarCreatedWebhook #webhook-${webhookId}`)
        return
      }

      // NOTE, that we cannot use `userId` because it's UUID, while in
      // `currentUser` we need to have integer user id
      const user = _.pick(await helper.getUserDetailsByUserUUID(userMeetingSettingsForCalendar.id), ['userId', 'handle'])

      await UserMeetingSettingsService.syncUserMeetingsSettings(user, {
        id: userMeetingSettingsForCalendar.id,
        // update default timezone same like in `UserMeetingSettingsService.handleConnectCalendarCallback`
        defaultTimezone: calendar.timezone || null,
        calendar: {
          ...calendarRecord,
          calendarId: calendar.id // we are only setting calendar id
        }
      })

      localLogger.debug(`Linked user settings "${userMeetingSettingsForCalendar.id}" account "${calendarRecord.accountId}" email "${calendarRecord.email}" with calendar "${calendar.id}".`, `processCalendarCreatedWebhook #webhook-${webhookId}`)
    }).then(() => {
      localLogger.debug(`#${mutexName} Mutex: released.`, `processCalendarCreatedWebhook #webhook-${webhookId}`)
    }).catch((err) => {
      localLogger.error(`#${mutexName} Mutex: error. "${err.toString()}".`, `processCalendarCreatedWebhook #webhook-${webhookId}`)
    })
  }).catch((err) => {
    localLogger.error(`Error "${err.toString()}".`, `processCalendarCreatedWebhook #webhook-${webhookId}`)
  })
}

// Each request made by Nylas includes an X-Nylas-Signature header. The header
// contains the HMAC-SHA256 signature of the request body, using your client
// secret as the signing key. This allows your app to verify that the
// notification really came from Nylas.
function verifyNylasRequest (req) {
  const digest = crypto
    .createHmac('sha256', config.get('NYLAS_CLIENT_SECRET'))
    .update(req.rawBody)
    .digest('hex')
  return digest === req.get('x-nylas-signature')
}

async function nylasWebhookCheck (req, res) {
  // Nylas will check to make sure your webhook is valid by making a GET
  // request to your endpoint with a challenge parameter when you add the
  // endpoint to the developer dashboard.  All you have to do is return the
  // value of the challenge parameter in the body of the response.
  return req.query.challenge
}

let nylasWebhookInvocationId = 0
async function nylasWebhook (req, res) {
  // Verify the request to make sure it's actually from Nylas.
  if (!verifyNylasRequest(req)) {
    localLogger.error('Failed to verify nylas', 'nylasWebhook')
    return res.status(401).send('X-Nylas-Signature failed verification 🚷 ')
  }

  try {
    // Nylas sent us a webhook notification for some kind of event, so we should
    // process it!
    const data = req.body.deltas
    for (let i = 0; i < data.length; i++) {
      if (eventProcessors[data[i].type]) {
        nylasWebhookInvocationId += 1
        localLogger.debug(`Processing Nylas Webhook type: "${data[i].type}", object id: "${_.get(data[i], 'object_data.id')}", date: "${data[i].date ? moment.unix(data[i].date).utc().format() : 'na'}", data: ${JSON.stringify(data[i])}.`, `nylasWebhook #webhook-${nylasWebhookInvocationId}`)
        await eventProcessors[data[i].type](data[i], nylasWebhookInvocationId)
      } else {
        localLogger.debug(`Ignoring Nylas Webhook type: "${data[i].type}", data: ${JSON.stringify(data[i])}.`, 'nylasWebhook')
      }
    }
  } catch (e) {
    localLogger.error(`Process nylas webhook failed with error: ${e.toString()}`, 'nylasWebhook')
  }

  // 200 response tells Nylas your endpoint is online and healthy.
  res.sendStatus(200)
}

module.exports = {
  nylasWebhook,
  nylasWebhookCheck
}
