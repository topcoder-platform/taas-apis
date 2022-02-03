const fs = require('fs')
const Joi = require('joi')
const config = require('config')
const path = require('path')
const _ = require('lodash')
const { Interviews, AggregatePaymentStatus, WorkPeriodPaymentStatus, WorkPeriodPaymentUpdateStatus, PaymentProcessingSwitch, WeeklySurveySwitch } = require('../app-constants')
const logger = require('./common/logger')

const allowedInterviewStatuses = _.values(Interviews.Status)

Joi.page = () => Joi.number().integer().min(1).default(1)
Joi.perPage = () => Joi.number().integer().min(1).default(20)
Joi.rateType = () => Joi.string().valid('hourly', 'daily', 'weekly', 'monthly', 'annual')
Joi.jobStatus = () => Joi.string().valid('sourcing', 'in-review', 'assigned', 'closed', 'cancelled')
Joi.jobRcrmStatus = () => Joi.string().valid('Open', 'On Hold', 'Canceled', 'Draft', 'Closed', 'Did not Post').allow(null)
Joi.jobTag = () => Joi.string().valid('New', '$$$', 'Hot').allow('')
Joi.resourceBookingStatus = () => Joi.string().valid('placed', 'closed', 'cancelled')
Joi.workload = () => Joi.string().valid('full-time', 'fractional')
Joi.jobCandidateStatus = () => Joi.string().valid('open', 'placed', 'selected', 'client rejected - screening', 'client rejected - interview', 'rejected - other', 'cancelled', 'interview', 'topcoder-rejected', 'applied', 'rejected-pre-screen', 'skills-test', 'skills-test', 'phone-screen', 'job-closed', 'offered', 'withdrawn', 'withdrawn-prescreen')
Joi.title = () => Joi.string().max(128)
Joi.paymentStatus = () => Joi.string().valid(..._.values(AggregatePaymentStatus))
Joi.interviewStatus = () => Joi.string().valid(...allowedInterviewStatuses)
Joi.workPeriodPaymentStatus = () => Joi.string().valid(..._.values(WorkPeriodPaymentStatus))
Joi.workPeriodPaymentUpdateStatus = () => Joi.string().valid(..._.values(WorkPeriodPaymentUpdateStatus))
// Empty string is not allowed by Joi by default and must be enabled with allow('').
// See https://joi.dev/api/?v=17.3.0#string fro details why it's like this.
// In many cases we would like to allow empty string to make it easier to create UI for editing data.
Joi.stringAllowEmpty = () => Joi.string().allow('')
Joi.smallint = () => Joi.number().integer().min(-32768).max(32767)

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

// validate some configurable parameters for the app
const paymentProcessingSwitchSchema = Joi.string().label('PAYMENT_PROCESSING_SWITCH').valid(
  ...Object.values(PaymentProcessingSwitch)
)
const weeklySurveySwitchSchema = Joi.string().label('WEEKLY_SURVEY_SWITCH').valid(
  ...Object.values(WeeklySurveySwitch)
)
try {
  Joi.attempt(config.PAYMENT_PROCESSING.SWITCH, paymentProcessingSwitchSchema)
  Joi.attempt(config.WEEKLY_SURVEY.SWITCH, weeklySurveySwitchSchema)
} catch (err) {
  console.error(err.message)
  process.exit(1)
}
