/*
 * Handle events for Team.
 */

const _ = require('lodash')
const config = require('config')
const logger = require('../common/logger')
const helper = require('../common/helper')

/**
 * Once we create a team, the notification emails to be sent out.
 *
 * @param {Object} payload the event payload
 * @returns {undefined}
 */
async function sendNotificationEmail (payload) {
  const template = helper.getEmailTemplatesForKey('notificationEmailTemplates')['taas.notification.team-created']
  const data = {
    subject: template.subject,
    teamName: payload.project.name,
    teamUrl: `${config.TAAS_APP_URL}/${payload.project.id}`,
    jobList: _.map(payload.jobs, j => ({
      title: j.title,
      duration: j.duration,
      startDate: helper.formatDateEDT(j.startDate),
      jobUrl: `${config.TAAS_APP_URL}/${payload.project.id}/positions/${j.id}`
    })),
    notificationType: {
      newTeamCreated: true
    },
    description: 'New Team Created'
  }
  data.subject = helper.substituteStringByObject(data.subject, data)

  const emailData = {
    serviceId: 'email',
    type: 'taas.notification.team-created',
    details: {
      from: template.from,
      recipients: _.map(payload.project.members, m => _.pick(m, 'userId')),
      data,
      sendgridTemplateId: template.sendgridTemplateId,
      version: 'v3'
    }
  }
  await helper.postEvent(config.NOTIFICATIONS_CREATE_TOPIC, {
    notifications: [emailData]
  })
  logger.debug({
    component: 'TeamEventHandler',
    context: 'sendNotificationEmail',
    message: `project id: ${payload.project.id} created with jobs: ${_.join(_.map(payload.jobs, 'id'), ',')}`
  })
}

/**
 * Process team creating event.
 *
 * @param {Object} payload the event payload
 * @returns {undefined}
 */
async function processCreate (payload) {
  await sendNotificationEmail(payload)
}

module.exports = {
  processCreate
}
