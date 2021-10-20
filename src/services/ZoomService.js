const _ = require('lodash')
const axios = require('axios')
const jwt = require('jsonwebtoken')
const config = require('config')

// get & parse all Zoom account credentials in an in-memory array
const ALL_ZOOM_ACCOUNTS = _.split(config.ZOOM_ACCOUNTS, ',')
// this is the number of Zoom accounts left to use. This number gets reduced after each usage
let AVAILABLE_ZOOM_ACCOUNTS = ALL_ZOOM_ACCOUNTS.length

/**
 * Generate a Zoom JWT bearer access token
 *
 * @returns JWT bearer access token for Zoom API access
 */
async function generateZoomJWTBearerAccessToken () {
  // parse the Zoom account API key & secret from the credentials string
  const zoomAccountCredentials = _.split(ALL_ZOOM_ACCOUNTS[AVAILABLE_ZOOM_ACCOUNTS - 1], ':')
  const zoomAccountApiKey = zoomAccountCredentials[0]
  const zoomAccountApiSecret = zoomAccountCredentials[1]

  const token = jwt.sign(
    {},
    zoomAccountApiSecret,
    {
      algorithm: 'HS256',
      expiresIn: 1500,
      issuer: zoomAccountApiKey
    }
  )

  // reduce number of available Zoom accounts after each usage
  AVAILABLE_ZOOM_ACCOUNTS--
  return token
}

/**
 * Create Zoom meeting via Zoom API
 *
 * @returns Zoom API response
 */
async function createZoomMeeting () {
  // only proceed if there are Zoom accounts available for use
  if (AVAILABLE_ZOOM_ACCOUNTS > 0) {
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
  } else {
    throw new Error('No Zoom accounts available to use.')
  }
}

/**
 * Generate Zoom meeting link
 *
 * This method generates Zoom API JWT access token and uses it to
 * create a Zoom meeting and gets the meeting link.
 *
 * @returns The 'joining' url for the Zoom meeting
 */
async function generateZoomMeetingLink () {
  try {
    const meetingObject = await createZoomMeeting()

    // learn more: https://marketplace.zoom.us/docs/api-reference/zoom-api/meetings/meetingcreate#responses
    console.log(meetingObject.start_url, 'Zoom meeting link for host')
    console.log(meetingObject.join_url, 'Zoom meeting link for participants')

    return meetingObject.join_url
  } catch (err) {
    console.log(err.message)
    throw err
  }
}

module.exports = { generateZoomMeetingLink }
