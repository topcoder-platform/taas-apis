/**
 * Reindex Jobs data in Elasticsearch using data from database
 */
const config = require('config')
const logger = require('../../src/common/logger')
const helper = require('../../src/common/helper')

const jobId = helper.getParamFromCliArgs()
const index = config.get('esConfig.ES_INDEX_JOB')
const reIndexAllJobsPrompt = `WARNING: this would remove existent data! Are you sure you want to reindex the index ${index}?`
const reIndexJobPrompt = `WARNING: this would remove existent data! Are you sure you want to reindex the document with id ${jobId} in index ${index}?`

async function reIndexJobs () {
  if (jobId === null) {
    await helper.promptUser(reIndexAllJobsPrompt, async () => {
      try {
        await helper.indexBulkDataToES('Job', index, logger)
        process.exit(0)
      } catch (err) {
        logger.logFullError(err, { component: 'reIndexJobs' })
        process.exit(1)
      }
    })
  } else {
    await helper.promptUser(reIndexJobPrompt, async () => {
      try {
        await helper.indexDataToEsById(jobId, 'Job', index, logger)
        process.exit(0)
      } catch (err) {
        logger.logFullError(err, { component: 'reIndexJobs' })
        process.exit(1)
      }
    })
  }
}

reIndexJobs()
