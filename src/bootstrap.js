const fs = require('fs')
const Joi = require('joi')
const path = require('path')
const _ = require('lodash')
const { Interviews } = require('../app-constants')
const logger = require('./common/logger')

const allowedInterviewStatuses = _.values(Interviews.Status)

Joi.page = () => Joi.number().integer().min(1).default(1)
Joi.perPage = () => Joi.number().integer().min(1).default(20)
Joi.rateType = () => Joi.string().valid('hourly', 'daily', 'weekly', 'monthly')
Joi.jobStatus = () => Joi.string().valid('sourcing', 'in-review', 'assigned', 'closed', 'cancelled')
Joi.workload = () => Joi.string().valid('full-time', 'fractional')
Joi.jobCandidateStatus = () => Joi.string().valid('open', 'selected', 'shortlist', 'rejected', 'cancelled', 'interview')
Joi.title = () => Joi.string().max(128)
Joi.paymentStatus = () => Joi.string().valid('pending', 'partially-completed', 'completed', 'cancelled')
Joi.interviewStatus = () => Joi.string().valid(...allowedInterviewStatuses)
// Empty string is not allowed by Joi by default and must be enabled with allow('').
// See https://joi.dev/api/?v=17.3.0#string fro details why it's like this.
// In many cases we would like to allow empty string to make it easier to create UI for editing data.
Joi.stringAllowEmpty = () => Joi.string().allow('')

function buildServices (dir) {
  const files = fs.readdirSync(dir)

  files.forEach((file) => {
    const curPath = path.join(dir, file)
    fs.stat(curPath, (err, stats) => {
      if (err) return
      if (stats.isDirectory()) {
        buildServices(curPath)
      } else if (path.extname(file) === '.js') {
        const serviceName = path.basename(file, '.js')
        logger.buildService(require(curPath), serviceName)
      }
    })
  })
}

buildServices(path.join(__dirname, 'services'))
