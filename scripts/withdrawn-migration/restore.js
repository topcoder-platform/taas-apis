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
  const files = []
  fs.readdirSync(filePath).forEach(async (file) => {
    files.push(`${filePath}${file}`)
  })
  let totalSum = 0
  for (let j = 0; j < files.length; j++) {
    const data = fs.readFileSync(files[j], 'utf-8')
    const jobCandidates = JSON.parse(data)
    let summary = 0
    for (var i = 0; i < jobCandidates.length; i++) {
      const jc = await JobCandidate.findById(jobCandidates[i].id)
      if (jc) {
        const oldStatus = jc.status
        const updated = await jc.update({ status: jobCandidates[i].status })
        summary++
        totalSum++
        logger.info({ component: currentStep, message: `jobCandidate with ${jc.id} status restored from ${oldStatus} to ${updated.status}` })
      }
    };
    logger.info({ component: `${currentStep} Sub`, message: `Restored ${summary} jobCandidates from ${files[j]}` })
  }
  logger.info({ component: currentStep, message: `Report: Totally restored ${totalSum} jobCandidates` })
  logger.info({ component: currentStep, message: '*************************** Restore process finished ***************************' })
}

restore().then(() => {
  logger.info({ component: currentStep, message: 'Execution Finished!' })
  process.exit()
}).catch(err => {
  logger.error(err.message)
  process.exit(1)
})
