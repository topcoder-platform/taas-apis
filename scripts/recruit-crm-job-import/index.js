/*
 * Script to import Jobs data from Recruit CRM to Taas API.
 */

const Joi = require('joi')
  .extend(require('@joi/date'))
const _ = require('lodash')
const moment = require('moment')
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
  numPositions: Joi.number().integer().min(1).required(),
  userHandle: Joi.string(),
  customerRate: Joi.number(),
  memberRate: Joi.number(),
  skills: Joi.array().default([]),
  rateType: Joi.string().default('weekly').valid('hourly', 'daily', 'weekly', 'monthly', 'annual')
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
      err.info = info
      throw err
    }
    const jobData = _.pick(data, ['projectId', 'externalId', 'title', 'numPositions', 'skills'])
    if (data.numPositions === 1) {
      jobData.status = 'assigned'
    }
    const result = await helper.createJob(jobData)
    info.push({ text: `id: ${result.id} job created`, tag: 'job_created' })
    data.jobId = result.id
  }
  try {
    data.userId = (await helper.getUserByHandle(data.userHandle)).id
    logger.debug(`userHandle: ${data.userHandle} userId: ${data.userId}`)
  } catch (err) {
    if (!(err.message && err.message.includes('user not found'))) {
      err.info = info
      throw err
    }
    info.push({ text: err.message, tag: 'user_not_found' })
    return { status: constants.ProcessingStatus.Failed, info }
  }
  // create a resource booking if it does not already exist
  try {
    const result = await helper.getResourceBookingByJobIdAndUserId(data.jobId, data.userId)
    info.push({ text: `id: ${result.id} resource booking already exists`, tag: 'resource_booking_already_exists' })
    return { status: constants.ProcessingStatus.Successful, info }
  } catch (err) {
    if (!(err.message && err.message.includes('resource booking not found'))) {
      err.info = info
      throw err
    }
    try {
      const resourceBookingData = _.pick(data, ['projectId', 'jobId', 'userId', 'memberRate', 'customerRate', 'rateType'])
      resourceBookingData.startDate = moment(data.startDate).format('YYYY-MM-DD')
      resourceBookingData.endDate = moment(data.endDate).format('YYYY-MM-DD')
      resourceBookingData.status = moment(data.endDate).isBefore(moment()) ? 'closed' : 'placed'
      const result = await helper.createResourceBooking(resourceBookingData)
      info.push({ text: `id: ${result.id} resource booking created`, tag: 'resource_booking_created' })
      return { status: constants.ProcessingStatus.Successful, info }
    } catch (err) {
      err.info = info
      throw err
    }
  }
}

/**
 * The entry of the script.
 *
 * @returns {undefined}
 */
async function main () {
  const pathname = helper.getPathnameFromCommandline()
  const jobs = await helper.loadCSVFromFile(pathname, constants.fieldNameMap)
  const report = new Report()
  for (const job of jobs) {
    logger.debug(`processing line #${job._lnum} - ${JSON.stringify(job)}`)
    try {
      const result = await processJob(job)
      report.add({ lnum: job._lnum, ...result })
    } catch (err) {
      const info = err.info || []
      if (err.response) {
        report.add({ lnum: job._lnum, status: constants.ProcessingStatus.Failed, info: [{ text: err.response.error.toString().split('\n')[0], tag: 'request_error' }, ...info] })
      } else {
        report.add({ lnum: job._lnum, status: constants.ProcessingStatus.Failed, info: [{ text: err.message, tag: 'internal_error' }, ...info] })
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
