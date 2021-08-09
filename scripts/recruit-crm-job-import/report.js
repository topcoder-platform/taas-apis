/*
 * The Report class.
 */

const logger = require('./logger')
const constants = require('./constants')
const _ = require('lodash')

class Report {
  constructor () {
    this.messages = []
  }

  // append a message to the report
  add (message) {
    this.messages.push(message)
  }

  // print the last message to the console
  print () {
    const lastMessage = this.messages[this.messages.length - 1]
    const output = `#${lastMessage.lnum} - ${_.map(lastMessage.info, 'text').join('; ')}`
    if (lastMessage.status === constants.ProcessingStatus.Skipped) {
      logger.warn(output)
    }
    if (lastMessage.status === constants.ProcessingStatus.Successful) {
      logger.info(output)
    }
    if (lastMessage.status === constants.ProcessingStatus.Failed) {
      logger.error(output)
    }
  }

  // print a summary to the console
  printSummary () {
    // summarize total success, failure, skips
    const groups = _.groupBy(this.messages, 'status')
    const success = groups[constants.ProcessingStatus.Successful] || []
    const failure = groups[constants.ProcessingStatus.Failed] || []
    const skips = groups[constants.ProcessingStatus.Skipped] || []
    // summarize records created or already existing
    const groupsByTag = _.groupBy(_.flatten(_.map(this.messages, message => message.info)), 'tag')
    const jobsCreated = groupsByTag.job_created || []
    const resourceBookingsCreated = groupsByTag.resource_booking_created || []
    const jobsAlreadyExist = groupsByTag.job_already_exists || []
    const resourceBookingsAlreadyExist = groupsByTag.resource_booking_already_exists || []
    const validationErrors = groupsByTag.validation_error || []
    const userNotFound = groupsByTag.user_not_found || []
    const externalIdMissing = groupsByTag.external_id_missing || []
    const requestError = groupsByTag.request_error || []
    const internalError = groupsByTag.internal_error || []
    logger.info('=== summary ===')
    logger.info(`total: ${this.messages.length}`)
    logger.info(`success: ${success.length}`)
    logger.info(`failure: ${failure.length}`)
    logger.info(`skips: ${skips.length}`)
    logger.info(`jobs created: ${jobsCreated.length}`)
    logger.info(`resource bookings created: ${resourceBookingsCreated.length}`)
    logger.info(`jobs already exist: ${jobsAlreadyExist.length}`)
    logger.info(`resource bookings already exist: ${resourceBookingsAlreadyExist.length}`)
    logger.info(`validation errors: ${validationErrors.length}`)
    logger.info(`user not found: ${userNotFound.length}`)
    logger.info(`external id missing: ${externalIdMissing.length}`)
    logger.info(`request error: ${requestError.length}`)
    logger.info(`internal error: ${internalError.length}`)
    logger.info('=== summary ===')
  }
}

module.exports = Report
