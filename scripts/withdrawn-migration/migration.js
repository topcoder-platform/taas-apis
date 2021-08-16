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
  const files = []
  fs.readdirSync(filePath).forEach(async (file) => {
    files.push(`${filePath}${file}`)
  })
  let totalSum = 0
  for (let j = 0; j < files.length; j++) {
    const data = fs.readFileSync(files[j], 'utf-8')
    const jobCandidates = JSON.parse(data)
    let summary = 0
    for (let i = 0; i < jobCandidates.length; i++) {
      const jc = await JobCandidate.findById(jobCandidates[i].id)
      if (jc) {
        const oldStatus = jc.status
        const updated = await jc.update({ status: config.WITHDRAWN_STATUS_CHANGE_MAPPING[jobCandidates[i].status] })
        summary++
        totalSum++
        logger.info({ component: currentStep, message: `jobCandidate with ${jc.id} status changed from ${oldStatus} to ${updated.status}` })
      }
    };
    logger.info({ component: `${currentStep} Sub`, message: `Updated ${summary} jobCandidates from ${files[j]}` })
  }
  logger.info({ component: currentStep, message: `Report: Totally Updated ${totalSum} jobCandidates` })
  logger.info({ component: currentStep, message: '*************************** Migration process finished ***************************' })
}

migration().then(() => {
  logger.info({ component: currentStep, message: 'Execution Finished!' })
  process.exit()
}).catch(err => {
  logger.error(err.message)
  process.exit(1)
})
