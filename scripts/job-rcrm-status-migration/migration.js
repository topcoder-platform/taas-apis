/**
 * Migration the job rcrm status into Open status
 */
const fs = require('fs')
const path = require('path')
const { Job } = require('../../src/models')
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
    const rcrmIds = JSON.parse(data)
    let summary = 0
    for (let i = 0; i < rcrmIds.length; i++) {
      const jbs = await Job.findAll({
        where: { externalId: rcrmIds[i] }
      })
      for (let j = 0; j < jbs.length; j++) {
        if (jbs[j]) {
          const oldStatus = jbs[j].rcrmStatus
          const updated = await jbs[j].update({ rcrmStatus: 'Open' })
          summary++
          totalSum++
          logger.info({ component: currentStep, message: `job with rcrmId ${rcrmIds[i]} status changed from ${oldStatus} to ${updated.status}` })
        }
      }
    };
    logger.info({ component: `${currentStep} Sub`, message: `Updated ${summary} jobs from ${files[j]}` })
  }
  logger.info({ component: currentStep, message: `Report: Totally Updated ${totalSum} jobs` })
  logger.info({ component: currentStep, message: '*************************** Migration process finished ***************************' })
}

migration().then(() => {
  logger.info({ component: currentStep, message: 'Execution Finished!' })
  process.exit()
}).catch(err => {
  logger.error(err.message)
  process.exit(1)
})
