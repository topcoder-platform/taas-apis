const config = require('config')
const { Interviews: { Status: InterviewStatus } } = require('../../app-constants')

const crypto = require('crypto')
const moment = require('moment')
const _ = require('lodash')
const { validate: uuidValidate } = require('uuid')

const logger = require('../common/logger')
const { partiallyUpdateInterviewById } = require('./InterviewService')
const { getEventDetails } = require('./NylasService')
const { getAuditM2Muser, processInterviewWebhookUsingMutex } = require('../common/helper')
const { Interview } = require('../../src/models')
const errors = require('../common/errors')

const localLogger = {
  debug: (message, context) =>
    logger.debug({ component: 'NylasWebhookService', context, message }),
  error: (message, context) =>
    logger.error({ component: 'NylasWebhookService', context, message }),
  info: (message, context) =>
    logger.info({ component: 'NylasWebhookService', context, message })
}

const EVENTTYPES = {
  CREATED: 'event.created',
  UPDATED: 'event.updated',
  DELETED: 'event.deleted'
}

const getInterviewIdFromEvent = (event) => {
  // if we already update event description and added metadata, then use it to get interview id
  if (_.get(event, 'metadata.interviewId')) {
    return event.metadata.interviewId

  // if this is a new event and we haven't updated description yet, and haven't set metadata,
  // then parse description
  } else {
    const matchId = event.description.match(/tc-taas-interview-([^/]+)/)
    const interviewId = matchId && matchId[1]

    if (!uuidValidate(interviewId)) {
      throw new Error(`Cannot get interview id for event ${event.id}.`)
    }

    return interviewId
  }
}

/**
 * Processor for nylas webhook
 * @param {*} webhookData webhook delta data
 * @param {*} event event details
 */
async function processFormattedEvent (webhookData, event) {
  localLogger.debug(`get event, type: ${webhookData.type}, status: ${event.status}, data: ${JSON.stringify(webhookData)}, event: ${JSON.stringify(event)}`)

  const interviewId = getInterviewIdFromEvent(event)
  // this method is used by the Nylas webhooks, so use M2M user
  const m2mUser = getAuditM2Muser()

  // once event is created associate it with corresponding interview
  if (webhookData.type === EVENTTYPES.CREATED && event.status === 'confirmed') {
    try {
      const interview = await Interview.findById(interviewId)
      if (!interview) {
        throw new errors.BadRequestError(`Could not find interview with given id: ${interviewId}`)
      }

      await partiallyUpdateInterviewById(
        m2mUser,
        interviewId,
        {
          nylasEventId: event.id
          // other fields would be updated inside `partiallyUpdateInterviewByWebhook`
        }
      )

      if (interview.nylasEventId) {
        localLogger.debug(`Interview with id "${interview.id}" has been re-assigned from Nylas event id "${interview.nylasEventId}" to "${event.id}".`)
      } else {
        localLogger.debug(`Interview with id "${interview.id}" is now assigned to Nylas event id "${event.id}".`)
      }
    } catch (err) {
      logger.logFullError(err, { component: 'InterviewService', context: 'partiallyUpdateInterviewByWebhook' })
      throw new errors.BadRequestError(`Could not update interview: ${err.message}`)
    }
  } else if (
    webhookData.type === EVENTTYPES.UPDATED &&
    event.status === 'cancelled'
  ) {
    const interview = await Interview.findById(interviewId)
    if (!interview) {
      throw new errors.BadRequestError(`Could not find interview with given id: ${interviewId}`)
    }

    if (interview.nylasEventId === event.id && interview.status === InterviewStatus.Cancelled) {
      localLogger.info('Interview is already cancelled. Ignoring event.')
    } else if (interview.nylasEventId === event.id && interview.status !== InterviewStatus.Cancelled) {
      await partiallyUpdateInterviewById(
        m2mUser,
        interviewId,
        {
          status: InterviewStatus.Cancelled
        }
      )

      localLogger.debug(
        `Interview cancelled under account id ${
          event.accountId
        } (email is ${event.email}) in calendar id ${
          event.calendarId
        }. Event status is ${event.status} and it would have started from ${moment
          .unix(event.startTime)
          .format('MMM DD YYYY HH:mm')} and ended at ${moment
          .unix(event.endTime)
          .format('MMM DD YYYY HH:mm')}`
      )
    } else {
      localLogger.info("Event id doesn't match with nylas_event_id of interview. Ignoring event.")
    }
  }
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

async function nylasWebhook (req, res) {
  // Verify the request to make sure it's actually from Nylas.
  if (!verifyNylasRequest(req)) {
    localLogger.error('Failed to verify nylas')
    return res.status(401).send('X-Nylas-Signature failed verification 🚷 ')
  }

  try {
    // Nylas sent us a webhook notification for some kind of event, so we should
    // process it!
    const data = req.body.deltas
    for (let i = 0; i < data.length; i++) {
      // only process webhook with which we are interested in and ignore other
      if (_.includes([EVENTTYPES.CREATED, EVENTTYPES.UPDATED], data[i].type)) {
        // make sure that we process webhooks one by one for the same interview
        // if interviewId is not yet set inside the metadata, then such webhook would be processed
        // in the global queue
        const interviewIdOrNull = _.get(data[i], 'object_data.metadata.interviewId', null)
        // don't await for response to prevent gateway timeout
        // we have to use mutex here to support re-scheduling
        // otherwise when new event is created we might not yet update `nylasEventId`
        // and then we would accidentally cancel re-scheduled event
        processInterviewWebhookUsingMutex(interviewIdOrNull, async () => {
          try {
            const event = await getEventDetails(
              data[i].object_data.account_id,
              data[i].object_data.id
            )
            if (event) {
              await processFormattedEvent(data[i], event)
            }
          } catch (e) {
            localLogger.error(`Process nylas webhook failed with error: ${e.toString()}`)
          }
        })
      } else {
        localLogger.debug(`Ignoring Nylas Webhook type: "${data[i].type}".`)
      }
    }
  } catch (e) {
    localLogger.error(`Process nylas webhook failed with error: ${e.toString()}`)
  }

  // 200 response tells Nylas your endpoint is online and healthy.
  res.sendStatus(200)
}

module.exports = {
  nylasWebhook,
  nylasWebhookCheck
}
