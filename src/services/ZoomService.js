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
 * @returns { zoomAccountApiKey: string, zoomAccountApiSecret: string } zoom account credentials
 */
function getZoomAccountByRoundRobin () {
  if (ALL_ZOOM_ACCOUNTS.length === 0) {
    throw new Error('No Zoom accounts is configured by "ALL_ZOOM_ACCOUNTS" environment variable.')
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
 * @returns JWT bearer access token for Zoom API access
 */
async function generateZoomJWTBearerAccessToken () {
  const { zoomAccountApiKey, zoomAccountApiSecret } = getZoomAccountByRoundRobin()

  const token = jwt.sign(
    {},
    zoomAccountApiSecret,
    {
      algorithm: 'HS256',
      expiresIn: 1500,
      issuer: zoomAccountApiKey
    }
  )

  return token
}

/**
 * Create Zoom meeting via Zoom API
 *
 * @returns Zoom API response
 */
async function createZoomMeeting () {
  const accessToken = await generateZoomJWTBearerAccessToken()

  // POST request details in Zoom API docs:
  // https://marketplace.zoom.us/docs/api-reference/zoom-api/meetings/meetingcreate
  const res = await axios.post('https://api.zoom.us/v2/users/me/meetings', {
    type: 3
  }, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })

  return res.data
}

/**
 * Generate Zoom meeting link
 *
 * This method generates Zoom API JWT access token and uses it to
 * create a Zoom meeting and gets the meeting link.
 *
 * @returns The meeting urls for the Zoom meeting
 */
async function generateZoomMeetingLink () {
  try {
    const meetingObject = await createZoomMeeting()

    // learn more: https://marketplace.zoom.us/docs/api-reference/zoom-api/meetings/meetingcreate#responses
    console.log(meetingObject.start_url, 'Zoom meeting link for host')
    console.log(meetingObject.join_url, 'Zoom meeting link for participants')

    return meetingObject
  } catch (err) {
    console.log(err.message)
    throw err
  }
}

module.exports = { generateZoomMeetingLink }
