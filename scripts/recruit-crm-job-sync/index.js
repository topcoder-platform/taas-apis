/*
 * Script to sync values of Jobs from Recruit CRM to Taas API.
 */

const Joi = require('joi')
const Report = require('./report')
const config = require('./config')
const helper = require('./helper')
const constants = require('./constants')
const logger = require('./logger')

const jobSchema = Joi.object({
  allowApply: Joi.string().valid('Yes', 'No').required(),
  externalId: Joi.string().allow('')
}).unknown(true)

/**
 * Process single job data. The processing consists of:
 *  - Validate the data.
 *  - Skip processing if externalId is missing.
 *  - Search job by externalId and update its `isApplicationPageActive` property
      (skip processing if `isApplicationPageActive` is already set).
 *
 * @param {Object} job the job data
 * @param {Array} info contains processing details
 * @returns {Object}
 */
async function processJob (job, info = []) {
  // validate the data
  const { value: data, error } = jobSchema.validate(job)
  data.isApplicationPageActive = data.allowApply === 'Yes'
  if (error) {
    info.push({ text: error.details[0].message, tag: 'validation_error' })
    return { status: constants.ProcessingStatus.Failed, info }
  }
  // skip processing if externalId is missing
  if (!data.externalId) {
    info.push({ text: 'externalId is missing', tag: 'external_id_missing' })
    return { status: constants.ProcessingStatus.Skipped, info }
  }
  try {
    // search job by externalId and update its `isApplicationPageActive` property
    const existingJob = await helper.getJobByExternalId(data.externalId)
    logger.debug(`jobId: ${existingJob.id} isApplicationPageActive(current): ${existingJob.isApplicationPageActive} - isApplicationPageActive(to be synced): ${data.isApplicationPageActive}`)
    // skip processing if `isApplicationPageActive` is already set
    if (existingJob.isApplicationPageActive === data.isApplicationPageActive) {
      info.push({ text: 'isApplicationPageActive is already set', tag: 'is_application_page_active_already_set' })
      return { status: constants.ProcessingStatus.Skipped, info }
    }
    const updatedJob = await helper.updateJob(existingJob.id, { isApplicationPageActive: data.allowApply === 'Yes' })
    info.push({ text: `id: ${existingJob.id} isApplicationPageActive: ${updatedJob.isApplicationPageActive} "job" updated`, tag: 'job_is_application_page_active_updated', currentValue: updatedJob.isApplicationPageActive })
    return { status: constants.ProcessingStatus.Successful, info }
  } catch (err) {
    if (!(err.message && err.message.includes('job not found'))) {
      throw err
    }
    info.push({ text: `[EXTERNAL_ID_NOT_FOUND] ${err.message}`, tag: 'external_id_not_found' })
    return { status: constants.ProcessingStatus.Failed, info }
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
