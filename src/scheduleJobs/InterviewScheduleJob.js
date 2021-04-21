/*
 * Schedule for Interview.
 */

const _ = require('lodash')
const config = require('config')
const moment = require('moment')
const { Op } = require('sequelize')
const { Interviews } = require('../../app-constants')
const models = require('../models')
const logger = require('../common/logger')
const helper = require('../common/helper')

const Interview = models.Interview

/**
 * Update matched scheduled interview to completed.
 */
async function completeInterviewJob () {
  const matchedInterviews = await Interview.findAll({
    where: { status: { [Op.in]: [Interviews.Status.Scheduled, Interviews.Status.Rescheduled] }, startTimestamp: { [Op.lt]: moment().subtract(config.INTERVIEW_MAX_DURATION, 'hours').toDate() } }
  })
  logger.debug({ component: 'InterviewScheduleJob', context: 'completeInterviewJob', message: `starting to handle scheduled and rescheduled interview ${_.map(matchedInterviews, 'id')}` })
  for (const interview of matchedInterviews) {
    const oldValue = interview.toJSON()
    const updated = await interview.update({ status: Interviews.Status.Completed })
    await helper.postEvent(config.TAAS_INTERVIEW_UPDATE_TOPIC, updated.toJSON(), { oldValue })
    logger.info({ component: 'InterviewScheduleJob', context: 'completeInterviewJob', message: `update interview(${interview.id}) to completed` })
  }
  logger.debug({ component: 'InterviewScheduleJob', context: 'completeInterviewJob', message: `updated ${matchedInterviews.length} interview to completed` })
}

module.exports = {
  completeInterviewJob
}
