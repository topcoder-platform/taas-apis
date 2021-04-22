/**
 * Import data from a json file into the db and index it in Elasticsearch
 */
const config = require('config')
const { Interview, WorkPeriodPayment } = require('../../src/models')
const logger = require('../../src/common/logger')
const helper = require('../../src/common/helper')

const jobCandidateModelOpts = {
  modelName: 'JobCandidate',
  include: [{
    model: Interview,
    as: 'interviews'
  }]
}

const workPeriodModelOpts = {
  modelName: 'WorkPeriod',
  include: [{
    model: WorkPeriodPayment,
    as: 'payments'
  }]
}

const filePath = helper.getParamFromCliArgs() || config.DEFAULT_DATA_FILE_PATH
const userPrompt = `WARNING: this would remove existing data. Are you sure you want to import data from a json file with the path ${filePath}?`
const dataModels = ['Job', jobCandidateModelOpts, 'ResourceBooking', workPeriodModelOpts]

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
