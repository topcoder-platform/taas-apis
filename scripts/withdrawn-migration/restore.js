/**
 * Resotre the changed jobCandidates into its original state.
 */
const fs = require('fs')
const path = require('path')
const { JobCandidate } = require('../../src/models')
const logger = require('../../src/common/logger')

const currentStep = 'Restore'

async function restore () {
  logger.info({ component: currentStep, message: '*************************** Restore process started ***************************' })
  const filePath = path.join(__dirname, '/temp/')
  const data = fs.readFileSync(filePath + 'jobCandidate-backup.json', 'utf-8')
  const jobCandidates = JSON.parse(data)
  let summary = 0
  for (var i = 0; i < jobCandidates.length; i++) {
    const jc = await JobCandidate.findById(jobCandidates[i].id)
    if (jc) {
      const oldStatus = jc.status
      const updated = await jc.update({ status: jobCandidates[i].status })
      summary++
      logger.info({ component: currentStep, message: `jobCandidate with ${jc.id} status restored from ${oldStatus} to ${updated.status}` })
    }
  };
  logger.info({ component: currentStep, message: `Totally restored ${summary} jobCandidates` })
  logger.info({ component: currentStep, message: '*************************** Restore process finished ***************************' })
}

restore().then(() => {
  logger.info({ component: currentStep, message: 'Execution Finished!' })
  process.exit()
}).catch(err => {
  logger.error(err.message)
  process.exit(1)
})
