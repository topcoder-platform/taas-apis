/**
 * Reindex all data in Elasticsearch using data from database
 */
const config = require('config')
const { Interview } = require('../../src/models')
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

async function indexAll () {
  await helper.promptUser(userPrompt, async () => {
    try {
      await helper.indexBulkDataToES('Job', config.get('esConfig.ES_INDEX_JOB'), logger)
      await helper.indexBulkDataToES(jobCandidateModelOpts, config.get('esConfig.ES_INDEX_JOB_CANDIDATE'), logger)
      await helper.indexBulkDataToES('ResourceBooking', config.get('esConfig.ES_INDEX_RESOURCE_BOOKING'), logger)
      await helper.indexBulkDataToES('WorkPeriod', config.get('esConfig.ES_INDEX_WORK_PERIOD'), logger)
      process.exit(0)
    } catch (err) {
      logger.logFullError(err, { component: 'indexAll' })
      process.exit(1)
    }
  })
}

indexAll()
