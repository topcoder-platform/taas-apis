/**
 * Import data from a json file into the db and index it in Elasticsearch
 */
const config = require('config')
const logger = require('../../src/common/logger')
const helper = require('../../src/common/helper')

const filePath = helper.getParamFromCliArgs() || config.DEFAULT_DATA_FILE_PATH
const userPrompt = `WARNING: this would remove existing data. Are you sure you want to import data from a json file with the path ${filePath}?`
const dataModels = ['Job', 'JobCandidate', 'ResourceBooking', 'WorkPeriod', 'WorkPeriodPayment']

async function importData () {
  await helper.promptUser(userPrompt, async () => {
    try {
      await helper.importData(filePath, dataModels, logger)
      process.exit(0)
    } catch (err) {
      logger.logFullError(err, { component: 'importData' })
      process.exit(1)
    }
  })
}

importData()
