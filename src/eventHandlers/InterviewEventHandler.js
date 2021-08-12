/*
 * Handle events for Interview.
 */

const { Op } = require('sequelize')
const _ = require('lodash')
const config = require('config')
const models = require('../models')
const logger = require('../common/logger')
const helper = require('../common/helper')
const teamService = require('../services/TeamService')

/**
 * Once we request Interview for a JobCandidate, the invitation emails to be sent out.
 *
 * @param {Object} payload the event payload
 * @returns {undefined}
 */
async function sendInvitationEmail (payload) {
  const interview = payload.value
  // get customer details via job candidate user
  const jobCandidate = await models.JobCandidate.findById(interview.jobCandidateId)
  const job = await jobCandidate.getJob()
  teamService.sendEmail({}, {
    template: 'interview-invitation',
    cc: [interview.hostEmail, ...interview.guestEmails],
    data: {
      interview_id: interview.id,
      interview_round: interview.round,
      interviewee_name: interview.guestNames[0],
      interviewer_name: interview.hostName,
      xai_template: '/' + interview.templateUrl,
      additional_interviewers_name: (interview.guestNames.slice(1)).join(','),
      interview_length: interview.duration,
      job_name: job.title
    }
  })
}

/**
 * Check if there is overlapping interview, if there is overlapping, then send notifications.
 *
 * @param {Object} payload the event payload
 * @returns {undefined}
 */
async function checkOverlapping (payload) {
  const interview = payload.value
  const overlappingInterview = await models.Interview.findAll({
    where: {
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
        startTime: oli.startTimestamp,
        endTime: oli.endTimestamp
      })
    }

    const emailData = {
      serviceId: 'email',
      type: 'taas.notification.interviews-overlapping',
      details: {
        from: template.from,
        recipients: template.recipients,
        data: {
          subject: template.subject,
          interviews,
          notificationType: {
            overlappingInterview: true
          },
          description: 'Send notification if there is a new Interview created which overlaps existent interview by time (from "startTimestamp" till "endTimestamp"). Do the same if we update start/end timestamp for Some Interview and now it overlaps with another one'
        },
        sendgridTemplateId: template.sendgridTemplateId,
        version: 'v3'
      }
    }
    const slackData = {
      serviceId: 'slack',
      type: 'taas.notification.interviews-overlapping',
      details: {
        channel: config.NOTIFICATION_SLACK_CHANNEL,
        text: template.subject,
        blocks: _.flatMap(interviews, iv => [{
          type: 'context',
          elements: [{
            type: 'mrkdwn',
            text: `teamName: *${iv.teamName}*`
          }, {
            type: 'mrkdwn',
            text: `teamURL: ${iv.teamURL}`
          }, {
            type: 'mrkdwn',
            text: `jobTitle: *${iv.jobTitle}*`
          }, {
            type: 'mrkdwn',
            text: `jobURL: ${iv.jobURL}`
          }, {
            type: 'mrkdwn',
            text: `candidateUserHandle: *${iv.candidateUserHandle}*`
          }, {
            type: 'mrkdwn',
            text: `startTime: *${iv.startTime.toISOString()}*`
          }, {
            type: 'mrkdwn',
            text: `endTime: *${iv.endTime.toISOString()}*`
          }]
        }, { type: 'divider' }])
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
  await sendInvitationEmail(payload)
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
