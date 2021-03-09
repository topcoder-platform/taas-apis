/*
 * Provide some commonly used functions for scripts.
 */
const csv = require('csv-parser')
const fs = require('fs')
const request = require('superagent')

/**
 * Load CSV data from file.
 *
 * @param {String} pathname the pathname for the file
 * @param {Object} fieldNameMap mapping values of headers
 * @returns {Array} the result jobs data
 */
async function loadCSVFromFile (pathname, fieldNameMap = {}) {
  let lnum = 1
  const result = []
  return new Promise((resolve, reject) => {
    fs.createReadStream(pathname)
      .pipe(csv({
        mapHeaders: ({ header }) => fieldNameMap[header] || header
      }))
      .on('data', (data) => {
        result.push({ ...data, _lnum: lnum })
        lnum += 1
      })
      .on('error', err => reject(err))
      .on('end', () => resolve(result))
  })
}

/**
 * Get pathname from command line arguments.
 *
 * @returns {String} the pathname
 */
function getPathnameFromCommandline () {
  if (process.argv.length < 3) {
    throw new Error('pathname for the csv file is required')
  }
  const pathname = process.argv[2]
  if (!fs.existsSync(pathname)) {
    throw new Error(`pathname: ${pathname} path not exist`)
  }
  if (!fs.lstatSync(pathname).isFile()) {
    throw new Error(`pathname: ${pathname} path is not a regular file`)
  }
  return pathname
}

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
 * Find taas job by external id.
 *
 * @param {String} token the auth token
 * @param {String} taasApiUrl url for TaaS API
 * @param {String} externalId the external id
 * @returns {Object} the result
 */
async function getJobByExternalId (token, taasApiUrl, externalId) {
  const { body: jobs } = await request.get(`${taasApiUrl}/jobs`)
    .query({ externalId })
    .set('Authorization', `Bearer ${token}`)
  if (!jobs.length) {
    throw new Error(`externalId: ${externalId} job not found`)
  }
  return jobs[0]
}

module.exports = {
  loadCSVFromFile,
  getPathnameFromCommandline,
  sleep,
  getJobByExternalId
}
