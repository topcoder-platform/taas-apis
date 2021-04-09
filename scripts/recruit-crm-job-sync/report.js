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
    const groups = _.groupBy(this.messages, 'status')
    const groupsByTag = _.groupBy(_.flatten(_.map(this.messages, message => message.info)), 'tag')
    // summarize total fails
    const failure = groups[constants.ProcessingStatus.Failed] || []
    // summarize total skips
    const skips = groups[constants.ProcessingStatus.Skipped] || []
    // summarize total jobs with isApplicationPageActive being set to true/false
    const groupsByisApplicationPageActive = _.groupBy(groupsByTag.job_is_application_page_active_updated, 'currentValue')
    const jobsWithIsApplicationPageActiveSetToTrue = groupsByisApplicationPageActive.true || []
    const jobsWithIsApplicationPageActiveSetToFalse = groupsByisApplicationPageActive.false || []
    // summarize total records with externalId not found in Taas API
    const recordsWithExternalIdNotFound = groupsByTag.external_id_not_found || []
    logger.info('=== summary ===')
    logger.info(`No. of records read = ${this.messages.length}`)
    logger.info(`No. of records updated for field isApplicationPageActive = true = ${jobsWithIsApplicationPageActiveSetToTrue.length}`)
    logger.info(`No. of records updated for field isApplicationPageActive = false = ${jobsWithIsApplicationPageActiveSetToFalse.length}`)
    logger.info(`No. of records : externalId not found = ${recordsWithExternalIdNotFound.length}`)
    logger.info(`No. of records failed(all) = ${failure.length}`)
    logger.info(`No. of records failed(excluding "externalId not found") = ${failure.length - recordsWithExternalIdNotFound.length}`)
    logger.info(`No. of records skipped = ${skips.length}`)
  }
}

module.exports = Report
