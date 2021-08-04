/**
 * Back up the jobCandidates that we will update it's status
 */
const config = require('config')
const Sequelize = require('sequelize')
const fs = require('fs')
const path = require('path')
const { JobCandidate, ResourceBooking, Job } = require('../../src/models')
const logger = require('../../src/common/logger')

const currentStep = 'Backup'

async function backup () {
  logger.info({ component: currentStep, message: '*************************** Backup process started ***************************' })
  const filePath = path.join(__dirname, '/temp/')
  const Op = Sequelize.Op
  const jobCandidates = await JobCandidate.findAll({
    where: {
      status: 'placed'
    }
  })

  for (let i = 0; i < jobCandidates.length; i++) {
    const jc = jobCandidates[i]
    const job = await Job.findById(jc.jobId)
    const rb = await ResourceBooking.findOne({
      where: {
        userId: jc.userId,
        jobId: jc.jobId
      }
    })
    let completed = false
    if (rb && rb.endDate) {
      completed = new Date(rb.endDate) < new Date() && new Date(rb.endDate).toDateString() !== new Date().toDateString()
    }
    if (job.hoursPerWeek > config.JOBS_HOUR_PER_WEEK && !completed) {
      const statuses = ['applied', 'skills-test', 'phone-screen', 'open', 'interview', 'selected', 'offered']
      const filter = { [Op.and]: [] }
      filter[Op.and].push({ status: statuses })
      filter[Op.and].push({ userId: jc.userId })
      const candidates = await JobCandidate.findAll({
        where: filter
      })
      if (candidates && candidates.length > 0) {
        fs.writeFile(filePath + `jobcandidate-backup.json`, JSON.stringify(
          candidates
        ), (err) => {
          if (!err) {
            logger.info({ component: `${currentStep} Summary`, message: `Backup up finished. There are ${candidates.length} jobCandidates that need to be updated` })
            logger.info({ component: currentStep, message: '*************************** Backup process finished ***************************' })
            return
          }
          logger.error({ component: currentStep, message: err.message })
          process.exit(1)
        })
      }
    }
  }
}

backup().then(() => {
  logger.info({ component: currentStep, message: 'Execution Finished!' })
  process.exit()
}).catch(err => {
  logger.error(err.message)
  process.exit(1)
})
