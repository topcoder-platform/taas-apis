/*
 * Handle events for Interview.
 */

const { Op } = require('sequelize')
const _ = require('lodash')
const moment = require('moment-timezone')
const config = require('config')
const models = require('../models')
const logger = require('../common/logger')
const helper = require('../common/helper')
const Constants = require('../../app-constants')
const notificationsSchedulerService = require('../services/NotificationsSchedulerService')
const Interview = models.Interview
const { generateZoomMeetingLink } = require('../services/ZoomService')
/**
 * Send interview invitaion notifications
 * @param {*} interview the requested interview
 * @returns
 */
async function sendInterviewInvitationNotifications (interview) {
  logger.debug({
    component: 'InterviewEventHandler',
    context: 'sendInterviewInvitationNotifications',
    message: `send to interview ${interview.id}`
  })

  try {
    const template = 'taas.notification.interview-invitation'

    // const jobCandidate = await models.JobCandidate.findById(interview.jobCandidateId)
    // const { email, firstName, lastName } = await helper.getUserDetailsByUserUUID(interview.hostUserId)

    // send host email
    const data = await notificationsSchedulerService.getDataForInterview(interview)
    if (!data) { return }

    if (!_.isEmpty(data.guestEmail)) {
      // send guest emails
      await notificationsSchedulerService.sendNotification({}, {
        template,
        recipients: [{ email: data.guestEmail }],
        data: {
          ...data,
          subject: `${data.duration} minutes tech interview with ${data.guestFullName} for ${data.jobTitle} is requested by the Customer`,
          nylasPageSlug: interview.nylasPageSlug
        }
      })
    } else {
      logger.error({
        component: 'InterviewEventHandler',
        context: 'sendInterviewInvitationNotifications',
        message: `Interview id: ${interview.id} guest emails not present`
      })
    }
  } catch (e) {
    logger.error({
      component: 'InterviewEventHandler',
      context: 'sendInterviewInvitationNotifications',
      message: `Send email to interview ${interview.id}: ${e}`
    })
  }

  logger.debug({
    component: 'InterviewEventHandler',
    context: 'sendInterviewInvitationNotifications',
    message: `Sent notifications for interview ${interview.id}`
  })
}

/**
 * Send interview scheduled notifications
 * @param {*} interview the interview
 * @returns
 */
async function sendInterviewScheduledNotifications (payload) {
  const interview = payload.value
  const interviewOldValue = payload.options.oldValue

  if (interview.status === interviewOldValue.status) {
    logger.debug({
      component: 'InterviewEventHandler',
      context: 'sendInterviewScheduledNotifications',
      message: 'interview status is not changed'
    })
    return
  }

  if (!_.includes([Constants.Interviews.Status.Scheduled, Constants.Interviews.Status.Rescheduled], interview.status)) {
    logger.debug({
      component: 'InterviewEventHandler',
      context: 'sendInterviewScheduledNotifications',
      message: `not interested in interview - status: ${interview.status}`
    })
    return
  }

  logger.debug({
    component: 'InterviewEventHandler',
    context: 'sendInterviewScheduledNotifications',
    message: `sending for interview ${interview.id}`
  })

  try {
    const template = 'taas.notification.interview-link-for-host'

    const TIME_FORMAT = 'dddd MMM. Do, hh:mm a'

    const interviewEntity = await Interview.findOne({
      where: {
        [Op.or]: [
          { id: interview.id }
        ]
      }
    })
    // send host email
    const data = await notificationsSchedulerService.getDataForInterview(interviewEntity)
    if (!data) { return }

    const links = await generateZoomMeetingLink()

    const interviewCancelLink = `${config.TAAS_APP_BASE_URL}/interview/${interview.id}/cancel`
    const interviewRescheduleLink = `${config.TAAS_APP_BASE_URL}/interview/${interview.id}/reschedule`

    await notificationsSchedulerService.sendNotification({}, {
      template,
      recipients: [{ email: data.hostEmail }],
      data: {
        host: data.hostFullName,
        guest: data.guestFullName,
        jobTitle: data.jobTitle,
        zoomLink: links.start_url,
        start: moment(interview.startTimestamp).tz(interviewEntity.hostTimezone).format(TIME_FORMAT) + ` ${interviewEntity.hostTimezone}`,
        end: moment(interview.endTimestamp).tz(interviewEntity.hostTimezone).format(TIME_FORMAT) + ` ${interviewEntity.hostTimezone}`,
        hostTimezone: interviewEntity.hostTimezone,
        interviewCancelLink,
        interviewRescheduleLink
      }
    })

    if (!_.isEmpty(data.guestEmail)) {
      const template = 'taas.notification.interview-link-for-guest'
      // send guest emails
      await notificationsSchedulerService.sendNotification({}, {
        template,
        recipients: [{ email: data.guestEmail }],
        data: {
          host: data.hostFullName,
          guest: data.guestFullName,
          jobTitle: data.jobTitle,
          zoomLink: links.join_url,
          start: moment(interview.startTimestamp).tz(interviewEntity.guestTimezone).format(TIME_FORMAT) + ` ${interviewEntity.guestTimezone}`,
          end: moment(interview.endTimestamp).tz(interviewEntity.guestTimezone).format(TIME_FORMAT) + ` ${interviewEntity.guestTimezone}`,
          guestTimezone: interviewEntity.guestTimezone,
          interviewCancelLink,
          interviewRescheduleLink
        }
      })
    } else {
      logger.error({
        component: 'InterviewEventHandler',
        context: 'sendInterviewScheduledNotifications',
        message: `Interview id: ${interview.id} guest emails not present`
      })
    }
  } catch (e) {
    logger.error({
      component: 'InterviewEventHandler',
      context: 'sendInterviewScheduledNotifications',
      message: `Send email to interview ${interview.id}: ${e}`
    })
  }

  logger.debug({
    component: 'InterviewEventHandler',
    context: 'sendInterviewScheduledNotifications',
    message: `Sent notifications for interview ${interview.id}`
  })
}

/**
 * Send interview rescheduled notifications
 * @param {*} interview the interview
 * @returns
 */
async function sendInterviewRescheduledNotifications (payload) {
  const interview = payload.value
  const interviewOldValue = payload.options.oldValue

  if (!_.includes([Constants.Interviews.Status.Scheduled, Constants.Interviews.Status.Rescheduled], interviewOldValue.status)) {
    logger.debug({
      component: 'InterviewEventHandler',
      context: 'sendInterviewRescheduledNotifications',
      message: `interview status ${interviewOldValue.status} can not be rescheduled`
    })
    return
  }

  if (!_.includes([Constants.Interviews.Status.Scheduled, Constants.Interviews.Status.Rescheduled], interview.status)) {
    logger.debug({
      component: 'InterviewEventHandler',
      context: 'sendInterviewRescheduledNotifications',
      message: `not interested in interview - status: ${interview.status}`
    })
    return
  }

  if (moment(interview.startTimestamp).isSame(interviewOldValue.startTimestamp)) {
    logger.debug({
      component: 'InterviewEventHandler',
      context: 'sendInterviewRescheduledNotifications',
      message: 'interview has same startTime can not be rescheduled'
    })
    return
  }

  logger.debug({
    component: 'InterviewEventHandler',
    context: 'sendInterviewRescheduledNotifications',
    message: `sending for interview ${interview.id}`
  })

  try {
    const template = 'taas.notification.interview-rescheduled-host'

    const TIME_FORMAT = 'dddd MMM. Do, hh:mm a'

    const interviewEntity = await Interview.findOne({
      where: {
        [Op.or]: [
          { id: interview.id }
        ]
      }
    })
    // send host email
    const data = await notificationsSchedulerService.getDataForInterview(interviewEntity)
    if (!data) { return }

    const links = await generateZoomMeetingLink()

    const interviewCancelLink = `${config.TAAS_APP_BASE_URL}/interview/${interview.id}/cancel`
    const interviewRescheduleLink = `${config.TAAS_APP_BASE_URL}/interview/${interview.id}/reschedule`

    await notificationsSchedulerService.sendNotification({}, {
      template,
      recipients: [{ email: data.hostEmail }],
      data: {
        host: data.hostFullName,
        guest: data.guestFullName,
        jobTitle: data.jobTitle,
        zoomLink: links.start_url,
        oldStart: moment(interviewOldValue.startTimestamp).tz(interviewEntity.timezone).format(TIME_FORMAT) + ` ${interviewEntity.timezone}`,
        start: moment(interview.startTimestamp).tz(interviewEntity.timezone).format(TIME_FORMAT) + ` ${interviewEntity.timezone}`,
        end: moment(interview.endTimestamp).tz(interviewEntity.timezone).format(TIME_FORMAT) + ` ${interviewEntity.timezone}`,
        timezone: interviewEntity.timezone,
        interviewCancelLink,
        interviewRescheduleLink
      }
    })

    if (!_.isEmpty(data.guestEmail)) {
      const template = 'taas.notification.interview-rescheduled-guest'
      // send guest emails
      await notificationsSchedulerService.sendNotification({}, {
        template,
        recipients: [{ email: data.guestEmail }],
        data: {
          host: data.hostFullName,
          guest: data.guestFullName,
          jobTitle: data.jobTitle,
          zoomLink: links.join_url,
          oldStart: moment(interviewOldValue.startTimestamp).tz(interviewEntity.timezone).format(TIME_FORMAT) + ` ${interviewEntity.timezone}`,
          start: moment(interview.startTimestamp).tz(interviewEntity.timezone).format(TIME_FORMAT) + ` ${interviewEntity.timezone}`,
          end: moment(interview.endTimestamp).tz(interviewEntity.timezone).format(TIME_FORMAT) + ` ${interviewEntity.timezone}`,
          timezone: interviewEntity.timezone,
          interviewCancelLink,
          interviewRescheduleLink
        }
      })
    } else {
      logger.error({
        component: 'InterviewEventHandler',
        context: 'sendInterviewRescheduledNotifications',
        message: `Interview id: ${interview.id} guest emails not present`
      })
    }
  } catch (e) {
    logger.error({
      component: 'InterviewEventHandler',
      context: 'sendInterviewRescheduledNotifications',
      message: `Send email to interview ${interview.id}: ${e}`
    })
  }

  logger.debug({
    component: 'InterviewEventHandler',
    context: 'sendInterviewRescheduledNotifications',
    message: `Sent notifications for interview ${interview.id}`
  })
}

/**
 * Send interview cancelled notifications
 * @param {*} interview the interview
 * @returns
 */
async function sendInterviewCancelledNotifications (payload) {
  const interview = payload.value
  const interviewOldValue = payload.options.oldValue

  if (!_.includes([Constants.Interviews.Status.Scheduled, Constants.Interviews.Status.Rescheduled], interviewOldValue.status)) {
    logger.debug({
      component: 'InterviewEventHandler',
      context: 'sendInterviewCancelledNotifications',
      message: `interview status ${interviewOldValue.status} can not be cancelled`
    })
    return
  }
  if (interview.status !== Constants.Interviews.Status.Cancelled) {
    logger.debug({
      component: 'InterviewEventHandler',
      context: 'sendInterviewCancelledNotifications',
      message: `not interested in interview - status: ${interview.status}`
    })
    return
  }

  logger.debug({
    component: 'InterviewEventHandler',
    context: 'sendInterviewCancelledNotifications',
    message: `sending for interview ${interview.id}`
  })

  try {
    const template = 'taas.notification.interview-cancelled-host'

    const TIME_FORMAT = 'dddd MMM. Do, hh:mm a'

    const interviewEntity = await Interview.findOne({
      where: {
        [Op.or]: [
          { id: interview.id }
        ]
      }
    })
    // send host email
    const data = await notificationsSchedulerService.getDataForInterview(interviewEntity)
    if (!data) { return }

    await notificationsSchedulerService.sendNotification({}, {
      template,
      recipients: [{ email: data.hostEmail }],
      data: {
        host: data.hostFullName,
        guest: data.guestFullName,
        jobTitle: data.jobTitle,
        start: moment(interview.startTimestamp).tz(interviewEntity.timezone).format(TIME_FORMAT) + ` ${interviewEntity.timezone}`
      }
    })

    if (!_.isEmpty(data.guestEmail)) {
      const template = 'taas.notification.interview-cancelled-guest'
      // send guest emails
      await notificationsSchedulerService.sendNotification({}, {
        template,
        recipients: [{ email: data.guestEmail }],
        data: {
          host: data.hostFullName,
          guest: data.guestFullName,
          jobTitle: data.jobTitle,
          start: moment(interview.startTimestamp).tz(interviewEntity.timezone).format(TIME_FORMAT) + ` ${interviewEntity.timezone}`
        }
      })
    } else {
      logger.error({
        component: 'InterviewEventHandler',
        context: 'sendInterviewCancelledNotifications',
        message: `Interview id: ${interview.id} guest emails not present`
      })
    }
  } catch (e) {
    logger.error({
      component: 'InterviewEventHandler',
      context: 'sendInterviewCancelledNotifications',
      message: `Send email to interview ${interview.id}: ${e}`
    })
  }

  logger.debug({
    component: 'InterviewEventHandler',
    context: 'sendInterviewCancelledNotifications',
    message: `Sent notifications for interview ${interview.id}`
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
  await sendInterviewInvitationNotifications(payload.value)
  await checkOverlapping(payload)
}

/**
 * Process interview update event.
 *
 * @param {Object} payload the event payload
 * @returns {undefined}
 */
async function processUpdate (payload) {
  await sendInterviewRescheduledNotifications(payload)
  await sendInterviewCancelledNotifications(payload)
  await sendInterviewScheduledNotifications(payload)
  await checkOverlapping(payload)
}

module.exports = {
  processRequest,
  processUpdate
}
