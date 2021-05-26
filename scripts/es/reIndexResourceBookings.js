/**
 * Reindex ResourceBookings data in Elasticsearch using data from database
 */
const config = require('config')
const { WorkPeriod, WorkPeriodPayment } = require('../../src/models')
const logger = require('../../src/common/logger')
const helper = require('../../src/common/helper')

const resourceBookingId = helper.getParamFromCliArgs()
const index = config.get('esConfig.ES_INDEX_RESOURCE_BOOKING')
const reIndexAllResourceBookingsPrompt = `WARNING: this would remove existent data! Are you sure you want to reindex the index ${index}`
const reIndexResourceBookingPrompt = `WARNING: this would remove existent data! Are you sure you want to reindex the document with id ${resourceBookingId} in index ${index}?`

const resourceBookingModelOpts = {
  modelName: 'ResourceBooking',
  include: [{
    model: WorkPeriod,
    as: 'workPeriods',
    include: [{
      model: WorkPeriodPayment,
      as: 'payments'
    }]
  }]
}

async function reIndexResourceBookings () {
  if (resourceBookingId === null) {
    await helper.promptUser(reIndexAllResourceBookingsPrompt, async () => {
      try {
        await helper.indexBulkDataToES(resourceBookingModelOpts, index, logger)
        process.exit(0)
      } catch (err) {
        logger.logFullError(err, { component: 'reIndexResourceBookings' })
        process.exit(1)
      }
    })
  } else {
    await helper.promptUser(reIndexResourceBookingPrompt, async () => {
      try {
        await helper.indexDataToEsById(resourceBookingId, resourceBookingModelOpts, index, logger)
        process.exit(0)
      } catch (err) {
        logger.logFullError(err, { component: 'reIndexResourceBookings' })
        process.exit(1)
      }
    })
  }
}

reIndexResourceBookings()
