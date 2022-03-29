/**
 * Reindex all data in Elasticsearch using data from database
 */
const config = require('config')
const { Interview, WorkPeriod, WorkPeriodPayment } = require('../../src/models')
const logger = require('../../src/common/logger')
const helper = require('../../src/common/helper')

const userPrompt = 'WARNING: this would remove existent data! Are you sure want to reindex all indices?'

const jobCandidateModelOpts = {
  modelName: 'JobCandidate',
  include: [{
    model: Interview,
    as: 'interviews'
  }]
}

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

async function indexAll () {
  await helper.promptUser(userPrompt, async () => {
    try {
      await helper.indexBulkDataToES('Job', config.get('esConfig.ES_INDEX_JOB'), logger)
      await helper.indexBulkDataToES(jobCandidateModelOpts, config.get('esConfig.ES_INDEX_JOB_CANDIDATE'), logger)
      await helper.indexBulkDataToES(resourceBookingModelOpts, config.get('esConfig.ES_INDEX_RESOURCE_BOOKING'), logger)
      await helper.indexBulkDataToES('Role', config.get('esConfig.ES_INDEX_ROLE'), logger)
      await helper.indexBulkDataToES('UserMeetingSettings', config.get('esConfig.ES_INDEX_USER_MEETING_SETTINGS'), logger)
      process.exit(0)
    } catch (err) {
      logger.logFullError(err, { component: 'indexAll' })
      process.exit(1)
    }
  })
}

indexAll()
