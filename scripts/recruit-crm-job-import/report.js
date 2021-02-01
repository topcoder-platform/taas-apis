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
    const output = `#${lastMessage.lnum} - ${lastMessage.info.join('; ')}`
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
    const sucesss = groups[constants.ProcessingStatus.Successful] || []
    const failure = groups[constants.ProcessingStatus.Failed] || []
    const skips = groups[constants.ProcessingStatus.Skipped] || []
    logger.info('=== summary ===')
    logger.info(`total: ${this.messages.length}`)
    logger.info(`success: ${sucesss.length}`)
    logger.info(`failure: ${failure.length}`)
    logger.info(`skips: ${skips.length}`)
    logger.info('=== summary ===')
  }
}

module.exports = Report
