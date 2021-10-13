const _ = require('lodash')
const axios = require('axios')
const jwt = require('jsonwebtoken')
const config = require('config')

// update following line by adding more integers if more Zoom accounts are needed
const AVAILABLE_ZOOM_ACCOUNT_NUMBERS = [1, 2]

async function generateZoomJWTBearerAccessToken () {
  const apiKeyEnvVar = `ZOOM_JWT_API_KEY_ACC_${AVAILABLE_ZOOM_ACCOUNT_NUMBERS[0]}`
  const apiSecretEnvVar = `ZOOM_JWT_API_SECRET_ACC_${AVAILABLE_ZOOM_ACCOUNT_NUMBERS[0]}`

  const token = jwt.sign(
    {},
    config[apiSecretEnvVar],
    {
      algorithm: 'HS256',
      expiresIn: 1500,
      issuer: config[apiKeyEnvVar]
    }
  )

  _.pullAt(AVAILABLE_ZOOM_ACCOUNT_NUMBERS, 0)
  return token
}

async function createZoomMeeting () {
  if (AVAILABLE_ZOOM_ACCOUNT_NUMBERS.length > 0) {
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
