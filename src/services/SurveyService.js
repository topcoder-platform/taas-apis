const _ = require('lodash')
const logger = require('../common/logger')
const { searchResourceBookings } = require('./ResourceBookingService')
const { partiallyUpdateWorkPeriod } = require('./WorkPeriodService')
const { Scopes } = require('../../app-constants')
const { getUserById, getMemberDetailsByHandle } = require('../common/helper')
const { getCollectorName, createCollector, createMessage, upsertContactInSurveyMonkey, addContactsToSurvey, sendSurveyAPI } = require('../common/surveyMonkey')

const resourceBookingCache = {}
const contactIdToWorkPeriodIdMap = {}
const emailToWorkPeriodIdMap = {}

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
    page: 1,
    perPage: 1000
  }

  const options = {
    returnAll: false,
    returnFromDB: false
  }
  try {
    let resourceBookings = await searchResourceBookings(currentUser, criteria, options)
    resourceBookings = resourceBookings.result

    logger.info({ component: 'SurveyService', context: 'sendSurvey', message: 'load workPeriod successfullly' })

    const workPeriods = _.flatten(_.map(resourceBookings, 'workPeriods'))

    const collectors = {}

    // for each WorkPeriod make sure to creat a collector (one per week)
    // so several WorkPeriods for the same week would be included into on collector
    // and gather contacts (members) from each WorkPeriods
    for (const workPeriod of workPeriods) {
      // await partiallyUpdateWorkPeriod(currentUser, workPeriod.id, {sentSurvey: true})
      // await partiallyUpdateWorkPeriod(currentUser, workPeriod.id, {sentSurveyError: {errorCode: 23, errorMessage: "sf"}})
      try {
        const collectorName = getCollectorName(workPeriod.endDate)

        // create collector and message for each week if not yet
        if (!collectors[collectorName]) {
          const collectorId = await createCollector(collectorName)
          const messageId = await createMessage(collectorId)
          // create map
          contactIdToWorkPeriodIdMap[collectorName] = {}
          emailToWorkPeriodIdMap[collectorName] = {}
          collectors[collectorName] = {
            collectorId,
            messageId,
            contacts: []
          }
        }

        const resourceBooking = _.find(resourceBookings, (r) => r.id === workPeriod.resourceBookingId)
        const userInfo = {}
        if (!resourceBookingCache[resourceBooking.userId]) {
          let user = await getUserById(resourceBooking.userId)
          if (!user.email && user.handle) {
            user = await getMemberDetailsByHandle(user.handle)
          }
          if (user.email) {
            userInfo.email = user.email
            if (user.firstName) {
              userInfo.first_name = user.firstName
            }
            if (user.lastName) {
              userInfo.last_name = user.lastName
            }
            resourceBookingCache[resourceBooking.userId] = userInfo
          }
        }
        emailToWorkPeriodIdMap[collectorName][resourceBookingCache[resourceBooking.userId].email] = workPeriod.id
        // resourceBookingCache[resourceBooking.userId].workPeriodId  = workPeriod.id
        collectors[collectorName].contacts.push(resourceBookingCache[resourceBooking.userId])
      } catch (e) {
        await partiallyUpdateWorkPeriod(currentUser, workPeriod.id, { sentSurveyError: e })
      }
    }
    // add contacts
    for (const collectorName in collectors) {
      const collector = collectors[collectorName]
      collectors[collectorName].contacts = await upsertContactInSurveyMonkey(collector.contacts)

      for (const contact of collectors[collectorName].contacts) {
        contactIdToWorkPeriodIdMap[collectorName][contact.id] = emailToWorkPeriodIdMap[collectorName][contact.email]
      }
    }

    // send surveys
    for (const collectorName in collectors) {
      const collector = collectors[collectorName]
      try {
        await addContactsToSurvey(
          collector.collectorId,
          collector.messageId,
          collector.contacts
        )
        await sendSurveyAPI(collector.collectorId, collector.messageId)

        for (const contactId in contactIdToWorkPeriodIdMap[collectorName]) {
          await partiallyUpdateWorkPeriod(currentUser, contactIdToWorkPeriodIdMap[collectorName][contactId], { sentSurvey: true })
        }
      } catch (e) {
        for (const contactId in contactIdToWorkPeriodIdMap[collectorName]) {
          await partiallyUpdateWorkPeriod(currentUser, contactIdToWorkPeriodIdMap[collectorName][contactId], { sentSurveyError: e })
        }
      }
    }

    logger.info({ component: 'SurveyService', context: 'sendSurvey', message: 'send survey successfullly' })
  } catch (e) {
    logger.error({ component: 'SurveyService', context: 'sendSurvey', message: 'Error : ' + e.message })
  }
}

module.exports = {
  sendSurveys
}
