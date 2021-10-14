/**
 * Restore the job rcrm status into Open status
 */
const fs = require('fs')
const path = require('path')
const { Job } = require('../../src/models')
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
    const rcrmIds = JSON.parse(data)
    let summary = 0
    for (let i = 0; i < rcrmIds.length; i++) {
      const jbs = await Job.findAll({
        where: { externalId: rcrmIds[i] }
      })
      for (let j = 0; j < jbs.length; j++) {
        if (jbs[j]) {
          const oldStatus = jbs[j].rcrmStatus
          const updated = await jbs[j].update({ rcrmStatus: null })
          summary++
          totalSum++
          logger.info({ component: currentStep, message: `job with rcrmId ${rcrmIds[i]} status changed from ${oldStatus} to ${updated.status}` })
        }
      }
    };
    logger.info({ component: `${currentStep} Sub`, message: `Updated ${summary} jobs from ${files[j]}` })
  }
  logger.info({ component: currentStep, message: `Report: Totally Restored ${totalSum} jobs` })
  logger.info({ component: currentStep, message: '*************************** Restore process finished ***************************' })
}

restore().then(() => {
  logger.info({ component: currentStep, message: 'Execution Finished!' })
  process.exit()
}).catch(err => {
  logger.error(err.message)
  process.exit(1)
})
