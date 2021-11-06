/**
 * This service provides operations to interact with Nylas API
 */

const axios = require('axios')
const config = require('config')
const _ = require('lodash')
const { NylasVirtualCalendarProvider } = require('../../app-constants')

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
  const code = await authenticateAccount(userId, userEmail)
  const { accessToken } = await getAccessToken(code)
  try {
    const calendar = await createVirtualCalendar(userFullName, timezone, accessToken)

    return {
      id: calendar.id,
      accountId: calendar.account_id,
      accessToken,
      // we always use `nylas` as a provider for Virtual Calendars,
      // because from `getAccessToken` we might get other provider
      // if user has Google or Microsoft calendar connected because we don't remove them from Nylas
      accountProvider: NylasVirtualCalendarProvider,
      email: userEmail,
      isPrimary: calendar.is_primary,
      isDeleted: false
    }
  } catch (err) {
    throw new Error(`Could not create a virtual calendar because of error: ${JSON.stringify(err)}`)
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

function getAvailableTimeFromSchedulingPage (page) {
  return page.config.booking.opening_hours
}
function getTimezoneFromSchedulingPage (page) {
  return page.config.timezone
}

async function createSchedulingPage (interview, calendar, options) {
  const res = await axios.post('https://api.schedule.nylas.com/manage/pages', {
    access_tokens: [calendar.accessToken],
    slug: `tc-taas-interview-${interview.id}`,
    config: {
      appearance: {
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
          availability: [calendar.id],
          booking: calendar.id
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
          webhook_url: `${config.TC_API}/updateInterview/${interview.id}/nylas-webhooks` // `https://d3c7-77-120-181-211.ngrok.io/api/v5/updateInterview/${interview.id}/nylas-webhooks`
        }
      ],
      timezone: interview.timezone
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
async function getPrimaryCalendar (calendars) {
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

module.exports = {
  createVirtualCalendarForUser,
  createSchedulingPage,
  patchSchedulingPage,
  getAvailableTimeFromSchedulingPage,
  getTimezoneFromSchedulingPage,
  getExistingCalendars,
  getAccessToken,
  getPrimaryCalendar
}
