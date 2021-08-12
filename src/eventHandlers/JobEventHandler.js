/*
 * Handle events for Job.
 */

const { Op } = require('sequelize')
const config = require('config')
const _ = require('lodash')
const models = require('../models')
const logger = require('../common/logger')
const helper = require('../common/helper')
const JobCandidateService = require('../services/JobCandidateService')

/**
 * Cancel all related related candidates when a job is cancelled.
 *
 * @param {Object} payload the event payload
 * @returns {undefined}
 */
async function cancelJob (payload) {
  if (payload.value.status === payload.options.oldValue.status) {
    logger.debug({
      component: 'JobEventHandler',
      context: 'cancelJob',
      message: 'status not changed'
    })
    return
  }
  if (payload.value.status !== 'cancelled') {
    logger.debug({
      component: 'JobEventHandler',
      context: 'cancelJob',
      message: `not interested job - status: ${payload.value.status}`
    })
    return
  }
  // pull data from db instead of directly extract data from the payload
  // since the payload may not contain all fields when it is from partially update operation.
  const job = await models.Job.findById(payload.value.id)
  const candidates = await models.JobCandidate.findAll({
    where: {
      jobId: job.id,
      status: {
        [Op.not]: 'cancelled'
      }
    }
  })
  await Promise.all(candidates.map(candidate => JobCandidateService.partiallyUpdateJobCandidate(
    helper.getAuditM2Muser(),
    candidate.id,
    { status: 'cancelled' }
  ).then(result => {
    logger.info({
      component: 'JobEventHandler',
      context: 'cancelJob',
      message: `id: ${result.id} candidate got cancelled.`
    })
  })))
}

/**
 * Process job update event.
 *
 * @param {Object} payload the event payload
 * @returns {undefined}
 */
async function processUpdate (payload) {
  await cancelJob(payload)
}

/**
 * Process job create event.
 *
 * @param {Object} payload the event payload
 * @returns {undefined}
 */
async function processCreate (payload) {
  if (payload.options.onTeamCreating) {
    logger.debug({
      component: 'JobEventHandler',
      context: 'jobCreate',
      message: 'skip these jobs which are created together with the Team'
    })
    return
  }
  const template = helper.getEmailTemplatesForKey('notificationEmailTemplates')['taas.notification.job-created']
  const project = await helper.getProjectById({ isMachine: true }, payload.value.projectId)
  const emailData = {
    serviceId: 'email',
    type: 'taas.notification.job-created',
    details: {
      from: template.from,
      recipients: _.map(project.members, m => _.pick(m, 'email')),
      data: {
        subject: template.subject,
        teamName: project.name,
        jobTitle: payload.value.title,
        jobDuration: payload.value.duration,
        jobStartDate: payload.value.startDate,
        notificationType: {
          newJobCreated: true
        },
        description: 'Send notification a new Job was created'
      },
      sendgridTemplateId: template.sendgridTemplateId,
      version: 'v3'
    }
  }
  await helper.postEvent(config.NOTIFICATIONS_CREATE_TOPIC, {
    notifications: [emailData]
  })
  logger.debug({
    component: 'JobEventHandler',
    context: 'jobCreate',
    message: `teamName: ${project.name}, jobTitle: ${payload.value.title}, jobDuration: ${payload.value.duration}, jobStartDate: ${payload.value.startDate}`
  })
}

module.exports = {
  processUpdate,
  processCreate
}
