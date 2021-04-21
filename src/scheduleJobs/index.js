/*
 * The entry of schedule jobs.
 */

const schedule = require('node-schedule')
const config = require('config')
const { completeInterviewJob } = require('./InterviewScheduleJob')

/**
 * Attach the schedule jobs.
 *
 * @returns {undefined}
 */
function init () {
  schedule.scheduleJob(config.INTERVIEW_SCHEDULE_CRON, completeInterviewJob)
}

module.exports = {
  init
}
