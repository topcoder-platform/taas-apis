/*
 * Handle events for JobCandidate.
 */
const { Op } = require('sequelize')
const _ = require('lodash')
const config = require('config')
const models = require('../models')
const logger = require('../common/logger')
const helper = require('../common/helper')
const JobService = require('../services/JobService')
const JobCandidateService = require('../services/JobCandidateService')

/**
 * Once we create at least one JobCandidate for a Job, the Job status should be changed to in-review.
 *
 * @param {Object} payload the event payload
 * @returns {undefined}
 */
async function inReviewJob (payload) {
  const job = await models.Job.findById(payload.value.jobId)
  if (job.status === 'in-review') {
    logger.debug({
      component: 'JobCandidateEventHandler',
      context: 'inReviewJob',
      message: `id: ${job.id} job is already in in-review status`
    })
    return
  }
  if (payload.value.status === 'open') {
    await JobService.partiallyUpdateJob(
      helper.getAuditM2Muser(),
      job.id,
      { status: 'in-review' }
    ).then(result => {
      logger.info({
        component: 'JobCandidateEventHandler',
        context: 'inReviewJob',
        message: `id: ${result.id} job got in-review status.`
      })
    })
  } else {
    logger.debug({
      component: 'JobCandidateEventHandler',
      context: 'inReviewJob',
      message: `id: ${payload.value.id} candidate is not in open status`
    })
  }
}

/**
 * Actual Update Job Candidates
 *
 * @param {*} statuses the source status we'll update
 * @param {*} userId the userID
 */
async function updateJobCandidates (statuses, userId) {
  logger.info({
    component: 'JobCandidateEventHandler',
    context: 'updateJobCandidates',
    message: `Update jobCandidates for user ${userId}`
  })
  const filter = { [Op.and]: [] }
  filter[Op.and].push({ status: statuses })
  filter[Op.and].push({ userId: userId })
  const candidates = await models.JobCandidate.findAll({
    where: filter
  })
  if (candidates && candidates.length > 0) {
    _.each(candidates, async (candidate) => {
      logger.info({
        component: 'JobCandidateEventHandler',
        context: 'updateJobCandidates',
        message: `Begin update id: ${candidate.id}' candidate with ${candidate.status} status into ${config.WITHDRAWN_STATUS_CHANGE_MAPPING[candidate.status]} for userId: ${userId}`
      })
      await JobCandidateService.partiallyUpdateJobCandidate(
        helper.getAuditM2Muser(),
        candidate.id,
        { status: config.WITHDRAWN_STATUS_CHANGE_MAPPING[candidate.status] }
      ).then(result => {
        logger.info({
          component: 'JobCandidateEventHandler',
          context: 'updateJobCandidates',
          message: `Finish update id: ${result.id}' candidate into ${result.status} status for userId: ${userId}`
        })
      })
    })
  } else {
    logger.info({
      component: 'JobCandidateEventHandler',
      context: 'updateJobCandidates',
      message: `There are not jobCandidates for user ${userId} that required to be updated.`
    })
  }
}

/**
 * Update Job Candidates based on business rules
 *
 * @param {*} payload the updated jobCandidate info
 */
async function withDrawnJobCandidates (payload) {
  const jobCandidate = payload.value
  if (jobCandidate.status === 'placed') {
    const job = await models.Job.findById(payload.value.jobId)
    if (job.hoursPerWeek > config.JOBS_HOUR_PER_WEEK) {
      // find all these user's open job Candidate and mark the status as withdrawn or withdrawn-prescreen
      logger.info({
        component: 'JobCandidateEventHandler',
        context: 'withDrawnJobCandidates',
        message: `Begin update jobCandidates as ${payload.value.id} candidate's new gig is requiring more than 20 hrs per week`
      })
      await updateJobCandidates(['applied', 'skills-test', 'phone-screen', 'open', 'interview', 'selected', 'offered'], payload.value.userId)
      logger.info({
        component: 'JobCandidateEventHandler',
        context: 'withDrawnJobCandidates',
        message: `Finish update jobCandidates as ${payload.value.id} candidate`
      })
    } else {
      logger.debug({
        component: 'JobCandidateEventHandler',
        context: 'withDrawnJobCandidates',
        message: `id: ${payload.value.id} candidate is not placing on a gig requiring 20 hrs per week`
      })
    }
  }
}

/**
 * Process job candidate create event.
 *
 * @param {Object} payload the event payload
 * @returns {undefined}
 */
async function processCreate (payload) {
  await inReviewJob(payload)
  if (payload.value.status === 'placed') {
    await withDrawnJobCandidates(payload)
  }
  if (payload.value.status === 'selected') {
    await sendJobCandidateSelectedNotification(payload)
  }
}

/**
 * Send job candidate selected notification.
 *
 * @param {Object} payload the event payload
 * @returns {undefined}
 */
async function sendJobCandidateSelectedNotification (payload) {
  const jobCandidate = payload.value
  const job = await models.Job.findById(jobCandidate.jobId)
  const user = await helper.getUserById(jobCandidate.userId)
  const template = helper.getEmailTemplatesForKey('notificationEmailTemplates')['taas.notification.job-candidate-selected']
  const project = await helper.getProjectById({ isMachine: true }, job.projectId)
  const jobUrl = `${config.TAAS_APP_URL}/${project.id}/positions/${job.id}`
  const rcrmJobUrl = `${config.RCRM_APP_URL}/job/${job.externalId}`
  const teamUrl = `${config.TAAS_APP_URL}/${project.id}`
  const data = {
    subject: template.subject,
    teamName: project.name,
    teamUrl,
    jobTitle: job.title,
    jobDuration: job.duration,
    jobStartDate: helper.formatDateEDT(job.startDate),
    userHandle: user.handle,
    jobUrl,
    rcrmJobUrl,
    notificationType: {
      candidateSelected: true
    },
    description: 'Job Candidate Selected'
  }
  data.subject = helper.substituteStringByObject(data.subject, data)
  const emailData = {
    serviceId: 'email',
    type: 'taas.notification.job-candidate-selected',
    details: {
      from: template.from,
      recipients: (template.recipients || []).map(email => ({ email })),
      data,
      sendgridTemplateId: template.sendgridTemplateId,
      version: 'v3'
    }
  }
  const slackData = {
    serviceId: 'slack',
    type: 'taas.notification.job-candidate-selected',
    details: {
      channel: config.NOTIFICATION_SLACK_CHANNEL,
      text: data.subject,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*:ballot_box_with_check: Job Candidate is Selected*'
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: [
              `*Team Name*: <${teamUrl}|${project.name}>`,
              `*Job Title*: <${jobUrl}|${job.title}> (<${rcrmJobUrl}|Open in RCRM>)`,
              `*Job Start Date*: ${helper.formatDateEDT(job.startDate)}`,
              `*Job Duration*: ${job.duration}`,
              `*Job Candidate*: ${user.handle}`
            ].join('\n')
          }
        }
      ]
    }
  }
  await helper.postEvent(config.NOTIFICATIONS_CREATE_TOPIC, {
    notifications: [emailData, slackData]
  })
  logger.debug({
    component: 'JobCandidateEventHandler',
    context: 'sendJobCandidateSelectedNotification',
    message: `teamName: ${project.name}, jobTitle: ${payload.value.title}, jobDuration: ${payload.value.duration}, jobStartDate: ${payload.value.startDate}`
  })
}

/**
 * Process job candidate update event.
 *
 * @param {Object} payload the event payload
 * @returns {undefined}
 */
async function processUpdate (payload) {
  await inReviewJob(payload)
  if (payload.value.status === 'placed' && payload.options.oldValue.status !== 'placed') {
    await withDrawnJobCandidates(payload)
  }
  if (payload.value.status === 'selected' && payload.options.oldValue.status !== 'selected') {
    await sendJobCandidateSelectedNotification(payload)
  }
}

module.exports = {
  processCreate,
  processUpdate
}
