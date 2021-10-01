/**
 * This service provides operations to interact with Nylas API
 */

const axios = require('axios')
const config = require('config')
const _ = require('lodash')

/**
 * @param {Object} calendarName the name of the Nylas calendar
 * @param {Object} hostTimezone the timezone of the event
 * @param {Object} accessToken the accessToken to authenticate with Nylas
 * @returns {Object} the created calendar
 */
async function _createVirtualCalendar (calendarName, hostTimezone, accessToken) {
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
  const code = await _authenticateAccount(userId, userEmail)
  const { accessToken } = await _getAccessToken(code)
  const calendar = await _createVirtualCalendar(userFullName, timezone, accessToken)
  return _.extend(calendar, { accessToken: accessToken })
}

async function _authenticateAccount (userId, email) {
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

// Step 2
async function _getAccessToken (code) {
  const res = await axios.post('https://api.nylas.com/connect/token', {
    client_id: config.NYLAS_CLIENT_ID,
    client_secret: config.NYLAS_CLIENT_SECRET,
    code
  })

  const { account_id: accountId, access_token: accessToken } = res.data

  return { accountId, accessToken }
}

function getAvailableTimeFromSchedulingPage (page) {
  return page.config.booking.opening_hours
}
function getTimezoneFromSchedulingPage (page) {
  return page.config.booking.timezone
}

async function createSchedulingPage (interview, calendar, eventLocation, eventTitle) {
  const res = await axios.post('https://api.schedule.nylas.com/manage/pages', {
    access_tokens: [calendar.accessToken],
    slug: `tc-taas-interview-${interview.id}`,
    config: {
      appearance: {
        show_autoschedule: false // Hides the Google / Outlook connect buttons in scheduling page
      },
      booking: {
        additional_guests_hidden: true,
        opening_hours: [].concat(interview.availableTime)
      },
      calendar_ids: {
        [calendar.account_id]: {
          availability: [calendar.id],
          booking: calendar.id
        }
      },
      event: {
        duration: interview.duration, // default duration.
        location: eventLocation,
        title: eventTitle // becomes the title of the Edit availability modal, unless overridden through UI
      },
      expire_after: {
        date: interview.expireTimestamp
      },
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
  const updatedPage = page
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
    const res = await axios.put(`https://api.schedule.nylas.com/manage/pages/${pageId}`, updatedPage)
    return res.data
  }
  // no changes
  return page
}

// async function main (req, res) {
//   let calendarId
//   let connectedCalendarName
//   let newUser = false
//   const { customer } = req.body

//   console.log('~~~~~~~~~~NEW REQUEST~~~~~~~~~~')
//   console.log(`Authenticating user account with user id ${customer.userId} and email ${customer.email}`)
//   const code = await authenticateAccount(customer.userId, customer.email)

//   console.log(`Fetching account id and access token with code ${code}`)
//   const { accountId, accessToken } = await getAccessToken(code)

//   console.log(`Checking for presence of existing calendars for this account using access token ${accessToken}`)
//   const calendars = await getExistingCalendars(accessToken)

//   console.log(`Existing calendars length is ${calendars.length}`)

//   if (calendars.length === 0) {
//     console.log(`No calendars exist. Creating a virtual calendar using access token ${accessToken}, handle ${customer.handle} and timezone ${customer.timezone}`)
//     calendarId = await createVirtualCalendar(`${customer.handle}'s virtual calendar`, customer.timezone, accessToken)
//     newUser = true
//   } else {
//     // We need a calendar id to create a scheduling page
//     // Get the primary calendar id or else the first calendar's id
//     console.log('Calendars exist. Finding primary or using first calendar')
//     const calendar = calendars.find(c => c.is_primary) || calendars[0]
//     calendarId = calendar.id
//     connectedCalendarName = calendar.name
//     console.log('Using calendar with id', calendarId)
//   }

//   // Check if we have scheduling pages for this user
//   // Not for new users / users whose calendars were just created earlier - they are guaranteed not to have them
//   if (!newUser) {
//     console.log(`Checking for existing scheduling pages using access token ${accessToken}`)
//     const schedulingPages = await getSchedulingPages(accessToken)

//     console.log(`Found ${schedulingPages.length} scheduling pages`)
//     if (schedulingPages.length > 0) {
//       console.log('Returning with the first scheduling page')
//       // If there's more than 1, we cannot help it - the app has no way to know which one the front end will be working with
//       // We assume here (see assumptions at the top of page) that it's the first one
//       res.send({
//         schedulingPage: schedulingPages[0],
//         connectedCalendar: {
//           name: connectedCalendarName
//         }
//       })
//       console.log('~~~~~~~~~~END REQUEST~~~~~~~~~~')
//       return
//     }
//   }

//   // If we have reached here, there's no scheduling page for this user. Let's create it
//   console.log(`No scheduling page detected. Creating one with account id ${accountId} and calendar id ${calendarId} and timezone ${customer.timezone} and access token ${accessToken}`)
//   const schedulingPage = await createSchedulingPage(accountId, calendarId, customer.timezone, accessToken)

//   res.send({
//     schedulingPage,
//     connectedCalendar: {
//       name: connectedCalendarName
//     }
//   })
//   console.log('~~~~~~~~~~END REQUEST~~~~~~~~~~')
// }

module.exports = {
  createVirtualCalendarForUser,
  createSchedulingPage,
  patchSchedulingPage,
  getAvailableTimeFromSchedulingPage,
  getTimezoneFromSchedulingPage
}
