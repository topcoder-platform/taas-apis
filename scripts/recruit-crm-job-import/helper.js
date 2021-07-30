/*
 * Provide some commonly used functions for the RCRM import script.
 */
const config = require('./config')
const _ = require('lodash')
const request = require('superagent')
const commonHelper = require('../common/helper')

/*
 * Function to get M2M token
 * @returns {Promise}
 */
const getM2MToken = (() => {
  const m2mAuth = require('tc-core-library-js').auth.m2m
  const m2m = m2mAuth(_.pick(config, [
    'AUTH0_URL',
    'AUTH0_AUDIENCE',
    'AUTH0_CLIENT_ID',
    'AUTH0_CLIENT_SECRET',
    'AUTH0_PROXY_SERVER_URL'
  ]))
  return async () => {
    return await m2m.getMachineToken(config.AUTH0_CLIENT_ID, config.AUTH0_CLIENT_SECRET)
  }
})()

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
  return commonHelper.getJobByExternalId(token, config.TAAS_API_URL, externalId)
}

/**
 * Update the status of a resource booking.
 *
 * @param {String} resourceBookingId the resource booking id
 * @param {Object} data the data to update
 * @returns {Object} the result
 */
async function updateResourceBooking (resourceBookingId, data) {
  const token = await getM2MToken()
  const { body: resourceBooking } = await request.patch(`${config.TAAS_API_URL}/resourceBookings/${resourceBookingId}`)
    .set('Authorization', `Bearer ${token}`)
    .set('Content-Type', 'application/json')
    .send(data)
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
  sleep: commonHelper.sleep,
  loadCSVFromFile: commonHelper.loadCSVFromFile,
  getPathnameFromCommandline: commonHelper.getPathnameFromCommandline,
  createJob,
  getJobByExternalId,
  updateResourceBooking,
  getResourceBookingByJobIdAndUserId,
  createResourceBooking,
  getUserByHandle,
  getProjectByDirectProjectId
}
