/**
 * Back up the jobs that we will update it's status
 */
const fs = require('fs')
const path = require('path')
const request = require('superagent')
const { Job } = require('../../src/models')
const logger = require('../../src/common/logger')

const currentStep = 'Backup'

async function backup () {
  logger.info({ component: currentStep, message: '*************************** Backup process started ***************************' })
  const filePath = path.join(__dirname, '/temp/')
  if (fs.existsSync(filePath)) {
    fs.rmdirSync(filePath, { recursive: true })
  }
  fs.mkdirSync(filePath)
  let { body: jobs } = await request.get('https://www.topcoder.com/api/recruit/jobs?job_status=1')
  jobs = jobs.map((item) => item.slug)
  const backupJobs = []
  if (jobs && jobs.length > 0) {
    try {
      const jbsInDb = await Job.findAll({
        where: { rcrmStatus: 'Open' }
      })
      for (const j of jbsInDb) {
        if (jobs.indexOf(j.externalId) < 0) {
          // The open job exists in taas but not showing up on Community-App
          backupJobs.push(j.externalId)
        }
      }
      fs.writeFileSync(filePath + 'jobs-backup.json', JSON.stringify(
        backupJobs
      ))
      logger.info({ component: `${currentStep} Sub`, message: `There are ${backupJobs.length} jobs that need to be updated` })
    } catch (err) {
      logger.error({ component: currentStep, message: err.message })
      process.exit(1)
    }
  }
  logger.info({ component: `${currentStep}`, message: `Report: there are ${backupJobs.length} jobs in total` })
  logger.info({ component: currentStep, message: '*************************** Backup process finished ***************************' })
}

backup().then(() => {
  logger.info({ component: currentStep, message: 'Execution Finished!' })
  process.exit()
}).catch(err => {
  logger.error(err.message)
  process.exit(1)
})
