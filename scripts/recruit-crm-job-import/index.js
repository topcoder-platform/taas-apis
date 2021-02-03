/*
 * Script to import Jobs data from Recruit CRM to Taas API.
 */

const csv = require('csv-parser')
const fs = require('fs')
const Joi = require('joi')
  .extend(require('@joi/date'))
const _ = require('lodash')
const dateFNS = require('date-fns')
const Report = require('./report')
const config = require('./config')
const helper = require('./helper')
const constants = require('./constants')
const logger = require('./logger')

const jobSchema = Joi.object({
  directProjectId: Joi.number().integer().required(),
  externalId: Joi.string().allow(''),
  title: Joi.string().required(),
  startDate: Joi.date().format('MM/DD/YYYY').required(),
  endDate: Joi.date().format('MM/DD/YYYY').required(),
  numPositions: Joi.number().integer().min(1),
  userHandle: Joi.string(),
  customerRate: Joi.number(),
  memberRate: Joi.number(),
  skills: Joi.array().default([]),
  rateType: Joi.string().default('weekly')
}).unknown(true)

/**
 * Validate job data.
 *
 * @param {Object} job the job data
 * @returns {Object} the validation result
 */
function validateJob (job) {
  return jobSchema.validate(job)
}

/**
 * Load Recruit CRM jobs data from file.
 *
 * @param {String} pathname the pathname for the file
 * @returns {Array} the result jobs data
 */
async function loadRcrmJobsFromFile (pathname) {
  let lnum = 1
  const result = []
  return new Promise((resolve, reject) => {
    fs.createReadStream(pathname)
      .pipe(csv({
        mapHeaders: ({ header }) => constants.fieldNameMap[header] || header
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
 * Get pathname for a csv file from command line arguments.
 *
 * @returns {undefined}
 */
function getPathname () {
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
 * Process single job data. The processing consists of:
 *  - Validate the data.
 *  - Skip processing if externalId is missing.
 *  - Create a job if it does not already exist.
 *  - Create a resource booking if it does not already exist.
 *  - Update the resourceBooking based on startDate and endDate.
 *
 * @param {Object} job the job data
 * @param {Array} info contains processing details
 * @returns {Object}
 */
async function processJob (job, info = []) {
  // validate the data
  const { value: data, error } = validateJob(job)
  if (error) {
    info.push({ text: error.details[0].message, tag: 'validation_error' })
    return { status: constants.ProcessingStatus.Failed, info }
  }
  if (!data.externalId) {
    info.push({ text: 'externalId is missing', tag: 'external_id_missing' })
    return { status: constants.ProcessingStatus.Skipped, info }
  }
  data.projectId = (await helper.getProjectByDirectProjectId(data.directProjectId)).id
  // create a job if it does not already exist
  try {
    const result = await helper.getJobByExternalId(data.externalId)
    info.push({ text: `id: ${result.id} externalId: ${data.externalId} job already exists`, tag: 'job_already_exists' })
    data.jobId = result.id
  } catch (err) {
    if (!(err.message && err.message.includes('job not found'))) {
      throw err
    }
    const result = await helper.createJob(_.pick(data, ['projectId', 'externalId', 'title', 'numPositions', 'skills']))
    info.push({ text: `id: ${result.id} job created`, tag: 'job_created' })
    data.jobId = result.id
  }
  data.userId = (await helper.getUserByHandle(data.userHandle)).id
  logger.debug(`userHandle: ${data.userHandle} userId: ${data.userId}`)
  // create a resource booking if it does not already exist
  try {
    const result = await helper.getResourceBookingByJobIdAndUserId(data.jobId, data.userId)
    info.push({ text: `id: ${result.id} resource booking already exists`, tag: 'resource_booking_already_exists' })
    return { status: constants.ProcessingStatus.Successful, info }
  } catch (err) {
    if (!(err.message && err.message.includes('resource booking not found'))) {
      throw err
    }
    const result = await helper.createResourceBooking(_.pick(data, ['projectId', 'jobId', 'userId', 'startDate', 'endDate', 'memberRate', 'customerRate', 'rateType']))
    info.push({ text: `id: ${result.id} resource booking created`, tag: 'resource_booking_created' })
    data.resourceBookingId = result.id
  }
  // update the resourceBooking based on startDate and endDate
  const resourceBookingStatus = dateFNS.compareAsc(new Date(data.startDate), new Date(data.endDate)) === 1 ? 'closed' : 'assigned'
  logger.debug(`resourceBookingId: ${data.resourceBookingId} status: ${resourceBookingStatus}`)
  await helper.updateResourceBookingStatus(data.resourceBookingId, resourceBookingStatus)
  info.push({ text: `id: ${data.resourceBookingId} status: ${resourceBookingStatus} resource booking updated`, tag: 'resource_booking_status_updated' })
  return { status: constants.ProcessingStatus.Successful, info }
}

/**
 * The entry of the script.
 *
 * @returns {undefined}
 */
async function main () {
  const pathname = getPathname()
  const jobs = await loadRcrmJobsFromFile(pathname)
  const report = new Report()
  for (const job of jobs) {
    logger.debug(`processing line #${job._lnum} - ${JSON.stringify(job)}`)
    try {
      const result = await processJob(job)
      report.add({ lnum: job._lnum, ...result })
    } catch (err) {
      if (err.response) {
        report.add({ lnum: job._lnum, status: constants.ProcessingStatus.Failed, info: [{ text: err.response.error.toString().split('\n')[0], tag: 'request_error' }] })
      } else {
        report.add({ lnum: job._lnum, status: constants.ProcessingStatus.Failed, info: [{ text: err.message, tag: 'internal_error' }] })
      }
    }
    report.print()
    logger.debug(`processed line #${job._lnum}`)
    await helper.sleep(config.SLEEP_TIME)
  }
  report.printSummary()
}

main().then(() => {
  logger.info('done!')
  process.exit()
}).catch(err => {
  logger.error(err.message)
  process.exit(1)
})
