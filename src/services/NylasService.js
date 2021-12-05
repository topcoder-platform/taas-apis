/**
 * This service provides operations to interact with Nylas API
 */

const axios = require('axios')
const { createHash } = require('crypto')
const config = require('config')
const _ = require('lodash')
const { v4: uuid } = require('uuid')
const errors = require('../common/errors')

/**
 * @param {Object} calendarName the name of the Nylas calendar
 * @param {Object} hostTimezone the timezone of the event
 * @param {Object} accessToken the accessToken to authenticate with Nylas
 * @returns {Object} the created calendar
 */
async function createVirtualCalendar (calendarName, hostTimezone, accessToken) {
  const res = await axios.post('https://api.nylas.com/calendars', {
    name: calendarName,
    description: 'Virtual Calendar',
    timezone: hostTimezone
  }, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
  return res.data
}

/**
 * @param {Object} userId id of the user
 * @param {Object} userEmail email of the user
 * @param {Object} userFullName fullname of the user
 * @param {Object} timezone the timezone of the event
 * @returns {String} id of the created virtual calendar
 */
async function createVirtualCalendarForUser (userId, userEmail, userFullName, timezone) {
  // We don't use email directly to identify user virtual calendar, because of the bug in Nylas
  // If user connects Google/Microsoft calendar using the same email,
  // then we always get Google/Microsoft account instead of nylas account
  // so to bypass it, instead of email we use email with prefix, so Nylas Virtual Calendar email
  // would never match real user email which they connect to Google/Microsoft
  const virtualCalendarEmail = `virtual-calendar:${userEmail}`
  const code = await authenticateAccount(userId, virtualCalendarEmail)
  const { accessToken, provider } = await getAccessToken(code)

  const existentCalendars = await getExistingCalendars(accessToken)
  let calendar = await getPrimaryCalendar(existentCalendars)

  // if don't have existent calendar, then create a new one
  if (!calendar) {
    try {
      calendar = await createVirtualCalendar(userFullName, timezone, accessToken)
    } catch (err) {
      throw new Error(`Could not create a virtual calendar because of error: ${JSON.stringify(err)}`)
    }
  }

  return {
    id: uuid(), // internal UUID
    calendarId: calendar.id,
    accountId: calendar.account_id,
    accessToken,
    accountProvider: provider,
    email: userEmail,
    isPrimary: calendar.is_primary,
    isDeleted: false
  }
}

async function getExistingCalendars (accessToken) {
  const res = await axios.get('https://api.nylas.com/calendars', {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })

  return res.data
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

async function authenticateAccount (userId, email) {
  const res = await axios.post('https://api.nylas.com/connect/authorize', {
    client_id: config.NYLAS_CLIENT_ID,
    provider: 'nylas',
    scopes: 'calendar',
    email,
    name: `${userId} virtual calendar`,
    settings: {}
  })

  return res.data.code
}

async function getAccessToken (code) {
  const res = await axios.post('https://api.nylas.com/connect/token', {
    client_id: config.NYLAS_CLIENT_ID,
    client_secret: config.NYLAS_CLIENT_SECRET,
    code
  })

  const { account_id: accountId, access_token: accessToken, provider, email_address: email } = res.data

  return { accountId, accessToken, provider, email }
}

async function getEvent (accountId, eventId) {
  const email = await getAccountEmail(accountId)
  const code = await authenticateAccount(accountId, email)
  const { accessToken } = await getAccessToken(code)

  try {
    const res = await axios.get(`https://api.nylas.com/events/${eventId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })

    return res.data
  } catch (err) {
    throw new Error(`Error getting event "${eventId}": ${err.toString()}`)
  }
}

/**
 * Get Nylas calendar
 *
 * @param {String} calendarId calendar id
 * @param {String} accessToken Nylas account access token
 * @returns {Promise<Object>} Nylas calendar
 */
async function getCalendar (calendarId, accessToken) {
  try {
    const res = await axios.get(`https://api.nylas.com/calendars/${calendarId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })

    return res.data
  } catch (err) {
    throw new Error(`Error getting calendar "${calendarId}": ${err.toString()}`)
  }
}

function getAvailableTimeFromSchedulingPage (page) {
  return page.config.booking.opening_hours
}
function getTimezoneFromSchedulingPage (page) {
  return page.config.timezone
}

async function createSchedulingPage (interview, calendar, options) {
  const webhookAuthTokenSecret = config.NYLAS_SCHEDULER_WEBHOOK_SECRET
  const authTokenHash = createHash('sha256')
    .update(webhookAuthTokenSecret)
    .digest('hex')

  const res = await axios.post('https://api.schedule.nylas.com/manage/pages', {
    access_tokens: [calendar.accessToken],
    slug: `tc-taas-interview-${interview.id}`,
    config: {
      appearance: {
        thank_you_redirect: `${config.TAAS_APP_BFF_BASE_URL}/misc/interview-thank-you-page`,
        show_autoschedule: false // Hides the Google / Outlook connect buttons in scheduling page
      },
      booking: {
        additional_guests_hidden: true,
        available_days_in_future: config.INTERVIEW_AVAILABLE_DAYS_IN_FEATURE,
        opening_hours: [].concat(interview.availableTime),
        // don't send confirmation emails using Nylas, as we are sending custom emails from TaaS
        confirmation_emails_to_guests: false,
        confirmation_emails_to_host: false
      },
      calendar_ids: {
        [calendar.accountId]: {
          availability: [calendar.calendarId],
          booking: calendar.calendarId
        }
      },
      event: {
        duration: interview.duration, // default duration.
        title: options.eventTitle // becomes the title of the Edit availability modal, unless overridden through UI
      },
      expire_after: {
        date: interview.expireTimestamp.unix()
      },
      reminders: [
        {
          delivery_method: 'webhook',
          delivery_recipient: 'owner',
          // This time needs to be greater than the furthest out an event can be scheduled in minutes.
          time_before_event: config.INTERVIEW_AVAILABLE_DAYS_IN_FEATURE * 24 * 60 + 1,
          webhook_url: `${config.NYLAS_SCHEDULER_WEBHOOK_BASE_URL}/updateInterview/${interview.id}/nylas-webhooks?authToken=${authTokenHash}`
        }
      ],
      timezone: interview.hostTimezone
    },
    disableViewingPages: true
  })

  return res.data
}

async function patchSchedulingPage (pageId, accessToken, changes) {
  const page = await axios.get(`https://api.schedule.nylas.com/manage/pages/${pageId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })

  let dirty = false
  const updatedPage = page.data
  if (!_.isNil(changes.duration)) {
    _.set(updatedPage, 'config.event.duration', changes.duration)
    dirty = true
  }
  if (!_.isNil(changes.availableTime)) {
    _.set(updatedPage, 'config.booking.opening_hours', [].concat(changes.availableTime))
    dirty = true
  }
  if (!_.isNil(changes.timezone)) {
    _.set(updatedPage, 'config.timezone', changes.timezone)
    dirty = true
  }

  if (dirty) {
    const res = await axios.put(`https://api.schedule.nylas.com/manage/pages/${pageId}`, updatedPage, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })
    return res.data
  }
  // no changes
  return page
}

/**
 * Detect calendar which would be used as a primary one
 *
 * @param {Array<Object>} calendars list of Nylas calendars
 * @returns
 */
async function findPrimaryCalendar (calendars) {
  const primaryCalendar = _.find(calendars, { is_primary: true, read_only: false })

  if (primaryCalendar) {
    return primaryCalendar
  }

  const writableCalendars = _.filter(calendars, { read_only: false })

  if (writableCalendars.length > 0) {
    return writableCalendars[0]
  }

  return null
}

/**
 * Update the Nylas event with provided data
 *
 * @param {string} eventId
 * @param {object} data - this endpoint only takes stringified values for any key in metadata
 * @returns {object} the updated event record
 */
async function updateEvent (eventId, data, accessToken) {
  try {
    const res = await axios.put(`https://api.nylas.com/events/${eventId}`, data, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })
    return res.data
  } catch (err) {
    throw new Error(`Error updating event "${eventId}" with data "${JSON.stringify(data)}": ${err.toString()}`)
  }
}

/**
 * Load calendars from Nylas and return the primary writable calendar
 *
 * @param {String} accessToken Nylas access token
 * @returns {Object} calendar
 */
async function getPrimaryCalendar (accessToken) {
  // getting user's all existing calendars
  const calendars = await getExistingCalendars(accessToken)
  if (!Array.isArray(calendars) || calendars.length < 1) {
    throw new errors.BadRequestError('Error getting calendar data for the user.')
  }

  const primaryCalendar = await findPrimaryCalendar(calendars)
  if (!primaryCalendar) {
    throw new errors.NotFoundError('Could not find any writable calendar.')
  }

  return primaryCalendar
}

module.exports = {
  createVirtualCalendarForUser,
  createSchedulingPage,
  patchSchedulingPage,
  getAvailableTimeFromSchedulingPage,
  getTimezoneFromSchedulingPage,
  getAccessToken,
  getEvent,
  getCalendar,
  getPrimaryCalendar,
  findPrimaryCalendar,
  getAccountEmail,
  updateEvent,
  authenticateAccount
}
