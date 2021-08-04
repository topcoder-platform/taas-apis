/**
 * Migration the jobCandidate status into expected status
 */
const config = require('config')
const fs = require('fs')
const path = require('path')
const { JobCandidate } = require('../../src/models')
const logger = require('../../src/common/logger')

const currentStep = 'Migration'

async function migration () {
  logger.info({ component: currentStep, message: '*************************** Migration process started ***************************' })
  const filePath = path.join(__dirname, '/temp/')
  const data = fs.readFileSync(filePath + 'jobCandidate-backup.json', 'utf-8')
  const jobCandidates = JSON.parse(data)
  let summary = 0
  for (var i = 0; i < jobCandidates.length; i++) {
    const jc = await JobCandidate.findById(jobCandidates[i].id)
    if (jc) {
      const oldStatus = jc.status
      const updated = await jc.update({ status: config.WITHDRAWN_STATUS_CHANGE_MAPPING[jobCandidates[i].status] })
      summary++
      logger.info({ component: currentStep, message: `jobCandidate with ${jc.id} status changed from ${oldStatus} to ${updated.status}` })
    }
  };
  logger.info({ component: currentStep, message: `Totally updated ${summary} jobCandidates` })
  logger.info({ component: currentStep, message: '*************************** Migration process finished ***************************' })
}

migration().then(() => {
  logger.info({ component: currentStep, message: 'Execution Finished!' })
  process.exit()
}).catch(err => {
  logger.error(err.message)
  process.exit(1)
})
