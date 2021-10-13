/*
 * Handle events for Interview.
 */

const { Op } = require('sequelize')
const _ = require('lodash')
const config = require('config')
const models = require('../models')
const logger = require('../common/logger')
const helper = require('../common/helper')
const Constants = require('../../app-constants')

/**
 * Check if there is overlapping interview, if there is overlapping, then send notifications.
 *
 * @param {Object} payload the event payload
 * @returns {undefined}
 */
async function checkOverlapping (payload) {
  const interview = payload.value
  if (_.includes([Constants.Interviews.Status.Cancelled, Constants.Interviews.Status.Completed], interview.status)) {
    return
  }
  const overlappingInterview = await models.Interview.findAll({
    where: {
      [Op.and]: [{
        status: _.values(_.omit(Constants.Interviews.Status, 'Completed', 'Cancelled'))
      }, {
        [Op.or]: [{
          startTimestamp: {
            [Op.lt]: interview.endTimestamp,
            [Op.gte]: interview.startTimestamp
          }
        }, {
          endTimestamp: {
            [Op.lte]: interview.endTimestamp,
            [Op.gt]: interview.startTimestamp
          }
        }, {
          [Op.and]: [{
            startTimestamp: {
              [Op.lt]: interview.startTimestamp
            }
          }, {
            endTimestamp: {
              [Op.gt]: interview.endTimestamp
            }
          }]
        }]
      }]
    }
  })
  if (_.size(overlappingInterview) > 1) {
    const template = helper.getEmailTemplatesForKey('notificationEmailTemplates')['taas.notification.interviews-overlapping']
    const jobCandidates = await models.JobCandidate.findAll({ where: { id: _.map(overlappingInterview, 'jobCandidateId') } })
    const jobs = await models.Job.findAll({ where: { id: _.uniq(_.map(jobCandidates, 'jobId')) } })

    const interviews = []
    for (const oli of overlappingInterview) {
      const jobCandidate = _.find(jobCandidates, { id: oli.jobCandidateId })
      const job = _.find(jobs, { id: jobCandidate.jobId })
      const project = await helper.getProjectById({ isMachine: true }, job.projectId)
      const user = await helper.getUserById(jobCandidate.userId)
      interviews.push({
        teamName: project.name,
        teamURL: `${config.TAAS_APP_URL}/${project.id}`,
        jobTitle: job.title,
        jobURL: `${config.TAAS_APP_URL}/${project.id}/positions/${job.id}`,
        candidateUserHandle: user.handle,
        startTime: helper.formatDateTimeEDT(oli.startTimestamp),
        endTime: helper.formatDateTimeEDT(oli.endTimestamp)
      })
    }

    const emailData = {
      serviceId: 'email',
      type: 'taas.notification.interviews-overlapping',
      details: {
        from: template.from,
        recipients: (template.recipients || []).map(email => ({ email })),
        data: {
          subject: template.subject,
          interviews
        },
        sendgridTemplateId: template.sendgridTemplateId,
        version: 'v3'
      }
    }
    const renderInterview = (iv) => (
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: [
            `*Team Name*: <${iv.teamURL}|${iv.teamName}>`,
            `*Job Title*: <${iv.jobURL}|${iv.jobTitle}>`,
            `*Job Candidate*: ${iv.candidateUserHandle}`,
            `*Start Time*: ${helper.formatDateTimeEDT(iv.startTime)}`,
            `*End Time*: ${helper.formatDateTimeEDT(iv.endTime)}`
          ].join('\n')
        }
      }
    )
    const slackData = {
      serviceId: 'slack',
      type: 'taas.notification.interviews-overlapping',
      details: {
        channel: config.NOTIFICATION_SLACK_CHANNEL,
        text: template.subject,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*:last_quarter_moon: Overlapping Job Candidate Interviews*'
            }
          },
          ..._.map(interviews, renderInterview)
        ]
      }
    }
    await helper.postEvent(config.NOTIFICATIONS_CREATE_TOPIC, {
      notifications: [emailData, slackData]
    })
    logger.debug({
      component: 'InterviewEventHandler',
      context: 'checkOverlapping',
      message: `interviewIds: ${_.join(_.map(overlappingInterview, 'id'), ',')}`
    })
  }
}

/**
 * Process interview request event.
 *
 * @param {Object} payload the event payload
 * @returns {undefined}
 */
async function processRequest (payload) {
  // await sendInvitationEmail(payload) //TODO this will be implemented in another challenge
  await checkOverlapping(payload)
}

/**
 * Process interview update event.
 *
 * @param {Object} payload the event payload
 * @returns {undefined}
 */
async function processUpdate (payload) {
  await checkOverlapping(payload)
}

module.exports = {
  processRequest,
  processUpdate
}
