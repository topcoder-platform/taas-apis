const _ = require('lodash')
const axios = require('axios')
const jwt = require('jsonwebtoken')
const config = require('config')

// get & parse all Zoom account credentials in an in-memory array
const ALL_ZOOM_ACCOUNTS = _.split(config.ZOOM_ACCOUNTS, ',')
let currentZoomAccountIndex = -1

/**
 * Get Zoom account credentials from the list credentials by round robin
 *
 * @param {String} apiKey zoom account api key
 * @returns { zoomAccountApiKey: string, zoomAccountApiSecret: string } zoom account credentials
 */
function getZoomAccountByRoundRobin (apiKey) {
  if (ALL_ZOOM_ACCOUNTS.length === 0) {
    throw new Error('No Zoom accounts is configured by "ALL_ZOOM_ACCOUNTS" environment variable.')
  }

  if (apiKey) {
    const zoomAccount = _.find(ALL_ZOOM_ACCOUNTS, a => _.startsWith(a, `${apiKey}:`))
    if (zoomAccount) {
      const [zoomAccountApiKey, zoomAccountApiSecret] = _.split(zoomAccount, ':')
      return { zoomAccountApiKey, zoomAccountApiSecret }
    } else {
      throw new Error(`No Zoom accounts is configured by "ALL_ZOOM_ACCOUNTS" environment matching the interview zoom meeting account ${apiKey}.`)
    }
  }

  const nextIndex = currentZoomAccountIndex + 1
  currentZoomAccountIndex = nextIndex >= ALL_ZOOM_ACCOUNTS.length ? 0 : nextIndex

  const [zoomAccountApiKey, zoomAccountApiSecret] = ALL_ZOOM_ACCOUNTS[currentZoomAccountIndex].split(':')

  return {
    zoomAccountApiKey,
    zoomAccountApiSecret
  }
}

/**
 * Generate a Zoom JWT bearer access token
 *
 * @param {String} apiKey zoom account api key
 * @returns JWT bearer access token for Zoom API access
 */
async function generateZoomJWTBearerAccessToken (apiKey) {
  const { zoomAccountApiKey, zoomAccountApiSecret } = getZoomAccountByRoundRobin(apiKey)

  const accessToken = jwt.sign(
    {},
    zoomAccountApiSecret,
    {
      algorithm: 'HS256',
      expiresIn: 1500,
      issuer: zoomAccountApiKey
    }
  )

  return { accessToken, zoomAccountApiKey }
}

/**
 * Create Zoom meeting via Zoom API
 *
 * @param {Date} startTime the start time of the meeting
 * @param {Integer} duration the duration of the meeting
 * @param {String} timezone the timezone of the meeting
 * @returns Zoom API response
 */
async function createZoomMeeting (startTime, duration, timezone) {
  const { accessToken, zoomAccountApiKey } = await generateZoomJWTBearerAccessToken()

  // POST request details in Zoom API docs:
  // https://marketplace.zoom.us/docs/api-reference/zoom-api/meetings/meetingcreate
  const res = await axios.post('https://api.zoom.us/v2/users/me/meetings', {
    type: 2,
    start_time: startTime.toISOString(),
    timezone,
    duration
  }, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })

  return { meeting: res.data, zoomAccountApiKey }
}

/**
 * Generate Zoom meeting link
 *
 * This method generates Zoom API JWT access token and uses it to
 * create a Zoom meeting and gets the meeting link.
 *
 * @param {Date} startTime the start time of the meeting
 * @param {Integer} duration the duration of the meeting
 * @param {String} timezone the timezone of the meeting
 * @returns The meeting urls for the Zoom meeting
 */
async function generateZoomMeetingLink (startTime, duration, timezone) {
  try {
    const { meeting, zoomAccountApiKey } = await createZoomMeeting(startTime, duration, timezone)

    // learn more: https://marketplace.zoom.us/docs/api-reference/zoom-api/meetings/meetingcreate#responses
    console.log(meeting.start_url, 'Zoom meeting link for host')
    console.log(meeting.join_url, 'Zoom meeting link for participants')

    return { meeting, zoomAccountApiKey }
  } catch (err) {
    console.log(err.message)
    throw err
  }
}

/**
 * Update Zoom meeting
 *
 * @param {Date} startTime the start time of the meeting
 * @param {Integer} duration the duration of the meeting
 * @param {String} apiKey zoom account api key
 * @param {Integer} zoomMeetingId zoom meeting id
 * @param {String} timezone the timezone of the meeting
 * @returns {undefined}
 */
async function updateZoomMeeting (startTime, duration, zoomAccountApiKey, zoomMeetingId, timezone) {
  const { accessToken } = await generateZoomJWTBearerAccessToken(zoomAccountApiKey)
  // PATCH request details in Zoom API docs:
  // https://marketplace.zoom.us/docs/api-reference/zoom-api/meetings/meetingupdate
  await axios.patch(`https://api.zoom.us/v2/meetings/${zoomMeetingId}`, {
    start_time: startTime.toISOString(),
    timezone,
    duration
  }, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
}

/**
 * Cancel Zoom meeting via Zoom API
 *
 * @param {String} zoomAccountApiKey zoom account api key
 * @param {Integer} zoomMeetingId zoom meeting id
 * @returns {undefined}
 */
async function cancelZoomMeeting (zoomAccountApiKey, zoomMeetingId) {
  const { accessToken } = await generateZoomJWTBearerAccessToken(zoomAccountApiKey)
  // DELETE request details in Zoom API docs:
  // https://marketplace.zoom.us/docs/api-reference/zoom-api/meetings/meetingdelete
  await axios.delete(`https://api.zoom.us/v2/meetings/${zoomMeetingId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
}

/**
 * Get Zoom meeting via Zoom API
 *
 * @param {String} zoomAccountApiKey zoom account api key
 * @param {Integer} zoomMeetingId zoom meeting id
 * @returns {undefined}
 */
async function getZoomMeeting (zoomAccountApiKey, zoomMeetingId) {
  const { accessToken } = await generateZoomJWTBearerAccessToken(zoomAccountApiKey)
  // GET request details in Zoom API docs:
  // https://marketplace.zoom.us/docs/api-reference/zoom-api/meetings/meeting
  const res = await axios.get(`https://api.zoom.us/v2/meetings/${zoomMeetingId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
  return res.data
}

module.exports = { generateZoomMeetingLink, updateZoomMeeting, cancelZoomMeeting, getZoomMeeting }
