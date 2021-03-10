/*
 * Provide some commonly used functions for the RCRM sync script.
 */
const config = require('./config')
const _ = require('lodash')
const commonHelper = require('../common/helper')
const request = require('superagent')

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
 * Partially update a job.
 *
 * @param {String} jobId the job id
 * @param {Object} data the data to be updated
 * @returns {Object} the result job
 */
async function updateJob (jobId, data) {
  const token = await getM2MToken()
  const { body: job } = await request.patch(`${config.TAAS_API_URL}/jobs/${jobId}`)
    .set('Authorization', `Bearer ${token}`)
    .set('Content-Type', 'application/json')
    .send(data)
  return job
}

module.exports = {
  sleep: commonHelper.sleep,
  loadCSVFromFile: commonHelper.loadCSVFromFile,
  getPathnameFromCommandline: commonHelper.getPathnameFromCommandline,
  getJobByExternalId,
  updateJob
}
