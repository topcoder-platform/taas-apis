/**
 * Export data to a json file
 */
const config = require('config')
const { Interview, WorkPeriod, WorkPeriodPayment } = require('../../src/models')
const logger = require('../../src/common/logger')
const helper = require('../../src/common/helper')

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

const filePath = helper.getParamFromCliArgs() || config.DEFAULT_DATA_FILE_PATH
const userPrompt = `WARNING: are you sure you want to export all data in the database to a json file with the path ${filePath}? This will overwrite the file.`
const dataModels = ['Job', jobCandidateModelOpts, resourceBookingModelOpts, 'Role']

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
