/*
 * Provide some commonly used functions for the RCRM import script.
 */
const config = require('./config')
const request = require('superagent')
const { getM2MToken } = require('../../src/common/helper')

/**
 * Sleep for a given number of milliseconds.
 *
 * @param {Number} milliseconds the sleep time
 * @returns {undefined}
 */
async function sleep (milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

/**
 * Create a new job via taas api.
 *
 * @param {Object} data the job data
 * @returns {Object} the result
 */
async function createJob (data) {
  const token = await getM2MToken()
  const { body: job } = await request.post(`${config.TAAS_API_URL}/jobs`)
    .set('Authorization', `Bearer ${token}`)
    .set('Content-Type', 'application/json')
    .send(data)
  return job
}

/**
 * Find taas job by external id.
 *
 * @param {String} externalId the external id
 * @returns {Object} the result
 */
async function getJobByExternalId (externalId) {
  const token = await getM2MToken()
  const { body: jobs } = await request.get(`${config.TAAS_API_URL}/jobs`)
    .query({ externalId })
    .set('Authorization', `Bearer ${token}`)
  if (!jobs.length) {
    throw new Error(`externalId: ${externalId} job not found`)
  }
  return jobs[0]
}

/**
 * Update the status of a resource booking.
 *
 * @param {String} resourceBookingId the resource booking id
 * @param {String} status the status for the resource booking
 * @returns {Object} the result
 */
async function updateResourceBookingStatus (resourceBookingId, status) {
  const token = await getM2MToken()
  const { body: resourceBooking } = await request.patch(`${config.TAAS_API_URL}/resourceBookings/${resourceBookingId}`)
    .set('Authorization', `Bearer ${token}`)
    .set('Content-Type', 'application/json')
    .send({ status })
  return resourceBooking
}

/**
 * Find taas resource booking by job id and user id.
 *
 * @param {String} jobId the job id
 * @param {String} userId the user id
 * @returns {Object} the result
 */
async function getResourceBookingByJobIdAndUserId (jobId, userId) {
  const token = await getM2MToken()
  const { body: resourceBookings } = await request.get(`${config.TAAS_API_URL}/resourceBookings`)
    .query({ jobId, userId })
    .set('Authorization', `Bearer ${token}`)
  if (!resourceBookings.length) {
    throw new Error(`jobId: ${jobId} userId: ${userId} resource booking not found`)
  }
  return resourceBookings[0]
}

/**
 * Create a new resource booking via taas api.
 *
 * @param {Object} data the resource booking data
 * @returns {Object} the result
 */
async function createResourceBooking (data) {
  const token = await getM2MToken()
  const { body: resourceBooking } = await request.post(`${config.TAAS_API_URL}/resourceBookings`)
    .set('Authorization', `Bearer ${token}`)
    .set('Content-Type', 'application/json')
    .send(data)
  return resourceBooking
}

/**
 * Find user via /v5/users by user handle.
 *
 * @param {String} handle the user handle
 * @returns {Object} the result
 */
async function getUserByHandle (handle) {
  const token = await getM2MToken()
  const { body: users } = await request.get(`${config.TC_API}/users`)
    .query({ handle })
    .set('Authorization', `Bearer ${token}`)
  if (!users.length) {
    throw new Error(`handle: ${handle} user not found`)
  }
  return users[0]
}

/**
 * Find project via /v5/projects by Direct project id.
 *
 * @param {Number} directProjectId the Direct project id
 * @returns {Object} the result
 */
async function getProjectByDirectProjectId (directProjectId) {
  const token = await getM2MToken()
  const { body: projects } = await request.get(`${config.TC_API}/projects`)
    .query({ directProjectId })
    .set('Authorization', `Bearer ${token}`)
  if (!projects.length) {
    throw new Error(`directProjectId: ${directProjectId} project not found`)
  }
  return projects[0]
}

module.exports = {
  sleep,
  createJob,
  getJobByExternalId,
  updateResourceBookingStatus,
  getResourceBookingByJobIdAndUserId,
  createResourceBooking,
  getUserByHandle,
  getProjectByDirectProjectId
}
