const config = require('config')
const models = require('../models')
const { Op } = require('sequelize')
const Interview = models.Interview
const _ = require('lodash')
const constants = require('../../app-constants')

const crypto = require('crypto')
const axios = require('axios')
const moment = require('moment')

const logger = require('../common/logger')
const { updateInterviewStatus } = require('./NotificationsSchedulerService')

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

async function getAccountEmail (accountId) {
  const base64Secret = Buffer.from(
    `${config.get('NYLAS_CLIENT_SECRET')}:`
  ).toString('base64')
  const res = await axios.get(
    `https://api.nylas.com/a/${config.get(
      'NYLAS_CLIENT_ID'
    )}/accounts/${accountId}`,
    {
      headers: {
        Authorization: `Basic ${base64Secret}`
      }
    }
  )

  return res.data.email
}

async function authenticateAccount (accountId, email) {
  const res = await axios.post('https://api.nylas.com/connect/authorize', {
    client_id: config.get('NYLAS_CLIENT_ID'),
    provider: 'nylas',
    scopes: 'calendar',
    email,
    name: `${accountId} virtual calendar`,
    settings: {}
  })

  return res.data.code
}

async function getAccessToken (code) {
  const res = await axios.post('https://api.nylas.com/connect/token', {
    client_id: config.get('NYLAS_CLIENT_ID'),
    client_secret: config.get('NYLAS_CLIENT_SECRET'),
    code
  })

  const { access_token: accessToken } = res.data

  return accessToken
}

async function getEventDetails (accountId, eventId) {
  const email = await getAccountEmail(accountId)
  const code = await authenticateAccount(accountId, email)
  const accessToken = await getAccessToken(code)

  try {
    const res = await axios.get(`https://api.nylas.com/events/${eventId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })

    const { when } = res.data
    const { end_time: endTime, start_time: startTime } = when

    return {
      endTime,
      startTime,
      status: res.data.status,
      accountId: res.data.account_id,
      email,
      calendarId: res.data.calendar_id,
      ..._.omit(res.data, ['account_id', 'calendar_id'])
    }
  } catch (error) {
    localLogger.error(`Get event details error, ${error.response.status}`)
  }
}

const parseInterviewId = (emailText) => {
  const sArray = emailText.trim().split('\n')
  const lastLine = sArray.slice(-1)[0]
  // eslint-disable-next-line
  const id = lastLine.match(/tc-taas-interview-([^\/]*)/)[1]
  return id
}

/**
 * Processor for nylas webhook
 * @param {*} webhookData webhook delta data
 * @param {*} event event details
 */
async function processFormattedEvent (webhookData, event) {
  localLogger.debug(`get event, type: ${webhookData.type}, status: ${event.status}`)

  const interviewId = parseInterviewId(event.description) // remove prefix

  const interview = await Interview.findOne({
    where: {
      [Op.or]: [{ id: interviewId }]
    }
  })

  if (webhookData.type === EVENTTYPES.CREATED && event.status === 'confirmed') {
    // CREATED + confirmed ==> inteview updated to scheduled
    // UPDATED + cancelled ==> inteview expired

    await updateInterviewStatus({
      status: constants.Interviews.Status.Scheduled,
      startTimestamp: moment.unix(event.startTime).toDate(),
      endTimestamp: moment.unix(event.endTime).toDate(),
      id: interview.id,
      jobCandidateId: interview.jobCandidateId
    })

    localLogger.debug(
      `~~~~~~~~~~~NEW EVENT~~~~~~~~~~~\nInterview Scheduled under account id ${
        event.accountId
      } (email is ${event.email}) in calendar id ${
        event.calendarId
      }. Event status is ${event.status} and starts from ${moment
        .unix(event.startTime)
        .format('MMM DD YYYY HH:mm')} and ends at ${moment
        .unix(event.endTime)
        .format('MMM DD YYYY HH:mm')}`
    )
  } else if (
    webhookData.type === EVENTTYPES.UPDATED &&
    event.status === 'cancelled'
  ) {
    await updateInterviewStatus({ status: constants.Interviews.Status.Cancelled, id: interview.id, jobCandidateId: interview.jobCandidateId })

    localLogger.debug(
      `~~~~~~~~~~~NEW EVENT~~~~~~~~~~~\nInterview cancelled under account id ${
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
    localLogger.debug(
      `~~~~~~~~~~~NEW EVENT~~~~~~~~~~~\nUnkonwn event under account id ${
        event.accountId
      } (email is ${event.email}) in calendar id ${
        event.calendarId
      }. Event status is ${event.status} and it starts from ${moment
        .unix(event.startTime)
        .format('MMM DD YYYY HH:mm')} and ends at ${moment
        .unix(event.endTime)
        .format('MMM DD YYYY HH:mm')}`
    )
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
      const event = await getEventDetails(
        data[i].object_data.account_id,
        data[i].object_data.id
      )
      if (event) {
        await processFormattedEvent(data[i], event)
      }
    }
  } catch (e) {
    localLogger.error('process nylas webhook failed\n')
  }

  // 200 response tells Nylas your endpoint is online and healthy.
  res.sendStatus(200)
}

module.exports = {
  nylasWebhook,
  nylasWebhookCheck
}
