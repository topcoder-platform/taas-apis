/**
 * Reindex WorkPeriods data in Elasticsearch using data from database
 */
const config = require('config')
const logger = require('../../src/common/logger')
const helper = require('../../src/common/helper')

const workPeriodId = helper.getParamFromCliArgs()
const index = config.get('esConfig.ES_INDEX_WORK_PERIOD')
const reIndexAllWorkPeriodsPrompt = `WARNING: this would remove existent data! Are you sure you want to reindex the index ${index}`
const reIndexWorkPeriodPrompt = `WARNING: this would remove existent data! Are you sure you want to reindex the document with id ${workPeriodId} in index ${index}?`

async function reIndexWorkPeriods () {
  if (workPeriodId === null) {
    await helper.promptUser(reIndexAllWorkPeriodsPrompt, async () => {
      try {
        await helper.indexBulkDataToES('WorkPeriod', index, logger)
        process.exit(0)
      } catch (err) {
        logger.logFullError(err, { component: 'reIndexWorkPeriods' })
        process.exit(1)
      }
    })
  } else {
    await helper.promptUser(reIndexWorkPeriodPrompt, async () => {
      try {
        await helper.indexDataToEsById(workPeriodId, 'WorkPeriod', index, logger)
        process.exit(0)
      } catch (err) {
        logger.logFullError(err, { component: 'reIndexWorkPeriods' })
        process.exit(1)
      }
    })
  }
}

reIndexWorkPeriods()
