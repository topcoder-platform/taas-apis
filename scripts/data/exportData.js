/**
 * Export data to a json file
 */
const config = require('config')
const logger = require('../../src/common/logger')
const helper = require('../../src/common/helper')

const filePath = helper.getParamFromCliArgs() || config.DEFAULT_DATA_FILE_PATH
const userPrompt = `WARNING: are you sure you want to export all data in the database to a json file with the path ${filePath}? This will overwrite the file.`
const dataModels = ['Job', 'JobCandidate', 'ResourceBooking']

async function exportData () {
  await helper.promptUser(userPrompt, async () => {
    try {
      await helper.exportData(filePath, dataModels, logger)
      process.exit(0)
    } catch (err) {
      logger.logFullError(err, { component: 'exportData' })
      process.exit(1)
    }
  })
}

exportData()
