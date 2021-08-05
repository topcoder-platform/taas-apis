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
  if (fs.existsSync(filePath)) {
    fs.rmdirSync(filePath, { recursive: true })
    fs.mkdirSync(filePath)
  }
  const Op = Sequelize.Op
  const jobCandidates = await JobCandidate.findAll({
    where: {
      status: 'placed'
    }
  })
  let summary = 0
  for (let i = 0; i < jobCandidates.length; i++) {
    const jc = jobCandidates[i]
    let job = null
    try {
      job = await Job.findById(jc.jobId)
    } catch (error) {
      // log the error
      logger.info({ component: currentStep, message: `==> Data integrity issue: Can't find the Job with Id ${jc.jobId}` })
    }
    if (!job) continue
    let rb = null
    try {
      rb = await ResourceBooking.findOne({
        where: {
          userId: jc.userId,
          jobId: jc.jobId
        }
      })
    } catch (error) {
      // log the error
      logger.info({ component: currentStep, message: `==> Data integrity issue: Can't find the ResourceBooking whose userId is ${jc.userId} and jobId is ${jc.jobId}` })
    }
    if (!rb) continue
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
        summary += candidates.length
        fs.writeFile(filePath + `jobcandidate-backup-${jc.userId}.json`, JSON.stringify(
          candidates
        ), (err) => {
          if (!err) {
            logger.info({ component: `${currentStep} Sub`, message: `There are ${candidates.length} jobCandidates that need to be updated for userId: ${jc.userId}` })
            return
          }
          logger.error({ component: currentStep, message: err.message })
          process.exit(1)
        })
      }
    }
  }
  logger.info({ component: `${currentStep}`, message: `Report: there are ${summary} jobCandidates in total` })
  logger.info({ component: currentStep, message: '*************************** Backup process finished ***************************' })
}

backup().then(() => {
  logger.info({ component: currentStep, message: 'Execution Finished!' })
  process.exit()
}).catch(err => {
  logger.error(err.message)
  process.exit(1)
})
