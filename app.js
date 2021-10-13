/**
 * The application entry point
 */

require('./src/bootstrap')
const _ = require('lodash')
const config = require('config')
const express = require('express')
const cors = require('cors')
const HttpStatus = require('http-status-codes')
const interceptor = require('express-interceptor')
const schedule = require('node-schedule')
const logger = require('./src/common/logger')
const eventHandlers = require('./src/eventHandlers')
const interviewService = require('./src/services/InterviewService')
const { processScheduler } = require('./src/services/PaymentSchedulerService')
const { sendSurveys } = require('./src/services/SurveyService')
const notificationSchedulerService = require('./src/services/NotificationsSchedulerService')
const { WeeklySurveySwitch } = require('./app-constants')

// setup express app
const app = express()

app.use(cors({
  // Allow browsers access pagination data in headers
  exposedHeaders: ['X-Page', 'X-Per-Page', 'X-Total', 'X-Total-Pages', 'X-Prev-Page', 'X-Next-Page']
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.set('port', config.PORT)

// intercept the response body from jwtAuthenticator
app.use(interceptor((req, res) => {
  return {
    isInterceptable: () => {
      return res.statusCode === 403
    },

    intercept: (body, send) => {
      let obj
      if (body.length > 0) {
        try {
          obj = JSON.parse(body)
        } catch (e) {
          logger.error('Invalid response body.')
        }
      }
      if (obj && _.get(obj, 'result.content.message')) {
        const ret = { message: obj.result.content.message }
        res.statusCode = 401
        send(JSON.stringify(ret))
      } else {
        send(body)
      }
    }
  }
}))

// Register routes
require('./app-routes')(app)

// The error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logger.logFullError(err, { component: 'app', signature: req.signature || `${req.method}_${req.url}` })
  const errorResponse = {}
  const status = err.isJoi ? HttpStatus.BAD_REQUEST : (err.status || err.httpStatus || HttpStatus.INTERNAL_SERVER_ERROR)

  if (_.isArray(err.details)) {
    if (err.isJoi) {
      _.map(err.details, (e) => {
        if (e.message) {
          if (_.isUndefined(errorResponse.message)) {
            errorResponse.message = e.message
          } else {
            errorResponse.message += `, ${e.message}`
          }
        }
      })
    }
  }

  if (err.response) {
    // extract error message from V3/V5 API
    errorResponse.message = _.get(err, 'response.body.result.content.message') || _.get(err, 'response.body.message')
  }

  if (_.isUndefined(errorResponse.message)) {
    if (err.message && (err.httpStatus || status !== HttpStatus.INTERNAL_SERVER_ERROR)) {
      errorResponse.message = err.message
    } else {
      errorResponse.message = 'Internal server error'
    }
  }

  res.status(status).json(errorResponse)
})

const server = app.listen(app.get('port'), () => {
  logger.info({ component: 'app', message: `Express server listening on port ${app.get('port')}` })
  eventHandlers.init()
  // schedule updateCompletedInterviews to run every hour
  schedule.scheduleJob('0 0 * * * *', interviewService.updateCompletedInterviews)
  // schedule sendSurveys
  if (WeeklySurveySwitch.ON === config.WEEKLY_SURVEY.SWITCH) {
    schedule.scheduleJob(config.WEEKLY_SURVEY.CRON, sendSurveys)
  }
  // schedule payment processing
  schedule.scheduleJob(config.PAYMENT_PROCESSING.CRON, processScheduler)

  schedule.scheduleJob(config.CRON_CANDIDATE_REVIEW, notificationSchedulerService.sendCandidatesAvailableNotifications)
  schedule.scheduleJob(config.CRON_INTERVIEW_COMING_UP, notificationSchedulerService.sendInterviewComingUpNotifications)
  schedule.scheduleJob(config.CRON_INTERVIEW_COMPLETED, notificationSchedulerService.sendInterviewCompletedNotifications)
  schedule.scheduleJob(config.CRON_POST_INTERVIEW, notificationSchedulerService.sendPostInterviewActionNotifications)
  schedule.scheduleJob(config.CRON_UPCOMING_RESOURCE_BOOKING, notificationSchedulerService.sendResourceBookingExpirationNotifications)

  setTimeout(() => {
    // notificationSchedulerService.sendInterviewExpiredNotifications()
    notificationSchedulerService.sendInterviewScheduleReminderNotifications()
  }, 3000)

  schedule.scheduleJob(config.CRON_INTERVIEW_EXPIRED, notificationSchedulerService.sendInterviewExpiredNotifications)
  schedule.scheduleJob(config.CRON_INTERVIEW_SCHEDULE_REMINDER, notificationSchedulerService.sendInterviewScheduleReminderNotifications)
})

if (process.env.NODE_ENV === 'test') {
  module.exports = server
}
