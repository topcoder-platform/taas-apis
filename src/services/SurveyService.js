const _ = require('lodash')
const logger = require('../common/logger')
const { searchResourceBookings } = require('./ResourceBookingService')
const { partiallyUpdateWorkPeriod } = require('./WorkPeriodService')
const { Scopes } = require('../../app-constants')
const { ensureTopcoderUserIdExists } = require('../common/helper')
const { getCollectorName, createCollector, createMessage, upsertContactInSurveyMonkey, addContactsToSurvey, sendSurveyAPI } = require('../common/surveyMonkey')

const resourceBookingCache = {}

function buildSentSurveyError (e) {
  return {
    errorCode: _.get(e, 'code'),
    errorMessage: _.get(e, 'message', e.toString())
  }
}

/**
 * Scheduler process entrance
 */
async function sendSurveys () {
  const currentUser = {
    isMachine: true,
    scopes: [Scopes.ALL_WORK_PERIOD, Scopes.ALL_WORK_PERIOD_PAYMENT]
  }

  const criteria = {
    fields: 'workPeriods,userId,id,sendWeeklySurvey',
    sendWeeklySurvey: true,
    'workPeriods.paymentStatus': 'completed',
    'workPeriods.sentSurvey': false,
    'workPeriods.sentSurveyError': '',
    jobIds: [],
    page: 1
  }

  const options = {
    returnAll: true,
    returnFromDB: true
  }
  try {
    let resourceBookings = await searchResourceBookings(currentUser, criteria, options)
    resourceBookings = resourceBookings.result

    logger.info({ component: 'SurveyService', context: 'sendSurvey', message: 'load workPeriod successfully' })

    const workPeriods = _.flatten(_.map(resourceBookings, 'workPeriods'))

    const collectors = {}

    // for each WorkPeriod make sure to creat a collector (one per week)
    // so several WorkPeriods for the same week would be included into on collector
    // and gather contacts (members) from each WorkPeriods
    for (const workPeriod of workPeriods) {
      try {
        const collectorName = getCollectorName(workPeriod.endDate)

        // create collector and message for each week if not yet
        if (!collectors[collectorName]) {
          const collectorId = await createCollector(collectorName)
          const messageId = await createMessage(collectorId)
          // create map
          collectors[collectorName] = {
            workPeriodIds: [],
            collectorId,
            messageId,
            contacts: []
          }
        }

        collectors[collectorName].workPeriodIds.push(workPeriod.id)

        const resourceBooking = _.find(resourceBookings, (r) => r.id === workPeriod.resourceBookingId)
        const userInfo = {}
        if (!resourceBookingCache[resourceBooking.userId]) {
          const tcUser = await ensureTopcoderUserIdExists(resourceBooking.userId)
          if (tcUser.email) {
            userInfo.email = tcUser.email
            if (tcUser.firstName) {
              userInfo.first_name = tcUser.firstName
            }
            if (tcUser.lastName) {
              userInfo.last_name = tcUser.lastName
            }
            resourceBookingCache[resourceBooking.userId] = userInfo
          }
        }
        collectors[collectorName].contacts.push(resourceBookingCache[resourceBooking.userId])
      } catch (e) {
        try {
          await partiallyUpdateWorkPeriod(
            currentUser,
            workPeriod.id,
            { sentSurveyError: buildSentSurveyError(e) }
          )
        } catch (e) {
          logger.error({ component: 'SurveyService', context: 'sendSurvey', message: `Error updating survey as failed for Work Period "${workPeriod.id}": ` + e.message })
        }
      }
    }

    // add contacts
    for (const collectorName of _.keys(collectors)) {
      const collector = collectors[collectorName]
      collectors[collectorName].contacts = await upsertContactInSurveyMonkey(collector.contacts)
    }

    // send surveys
    for (const collectorName of _.keys(collectors)) {
      const collector = collectors[collectorName]
      if (collector.contacts.length) {
        try {
          await addContactsToSurvey(
            collector.collectorId,
            collector.messageId,
            collector.contacts
          )
          await sendSurveyAPI(collector.collectorId, collector.messageId)
          logger.debug({ component: 'SurveyService', context: 'sendSurvey', message: `Sent survey for collector "${collectorName}" details:` + JSON.stringify(collector) })
          for (const workPeriodId of collectors[collectorName].workPeriodIds) {
            try {
              await partiallyUpdateWorkPeriod(currentUser, workPeriodId, { sentSurvey: true })
            } catch (e) {
              logger.error({ component: 'SurveyService', context: 'sendSurvey', message: `Error updating survey as sent for Work Period "${workPeriodId}": ` + e.message })
            }
          }
        } catch (e) {
          for (const workPeriodId of collectors[collectorName].workPeriodIds) {
            try {
              await partiallyUpdateWorkPeriod(
                currentUser,
                workPeriodId,
                { sentSurveyError: buildSentSurveyError(e) }
              )
            } catch (e) {
              logger.error({ component: 'SurveyService', context: 'sendSurvey', message: `Error updating survey as failed for Work Period "${workPeriodId}": ` + e.message })
            }
          }
        }
      }
    }

    logger.info({ component: 'SurveyService', context: 'sendSurvey', message: 'Processing weekly surveys is completed' })
  } catch (e) {
    logger.error({ component: 'SurveyService', context: 'sendSurvey', message: 'Error sending surveys: ' + e.message })
  }
}

module.exports = {
  sendSurveys
}
