/*
 * Handle events for Interview.
 */

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
  // get job candidate user details
  const jobCandidate = await models.JobCandidate.findById(interview.jobCandidateId)
  const jobCandidateUser = await helper.getUserById(jobCandidate.userId, true)
  const jobCandidateUserEmail = helper.getUserAttributeValue(jobCandidateUser, 'email')
  // get customer details
  const job = await jobCandidate.getJob()
  const customerUser = await helper.getUserByExternalId(job.externalId, true)
  const customerUserEmail = helper.getUserAttributeValue(customerUser, 'email')
  if (jobCandidateUserEmail && customerUserEmail) {
    teamService.sendEmail({}, {
      template: 'interview-invitation',
      recipients: [jobCandidateUserEmail, customerUserEmail],
      cc: interview.attendeesList,
      data: {
        interviewType: interview.xaiTemplate,
        jobName: job.title,
        candidateName: `${jobCandidateUser.firstName} ${jobCandidateUser.lastName}`,
        customMessage: interview.customMessage
      }
    })
  } else {
    // one (or both) of the emails are missing due to some reason
    // for e.g. some users' externalIds may be set to null or similar
    // log error
    logger.error({
      component: 'InterviewEventHandler',
      context: 'sendInvitationEmail',
      message: 'Couldn\'t sent invitation emails. Insufficient details.'
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
}

module.exports = {
  processRequest
}
