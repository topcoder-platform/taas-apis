/*
 * Handle events for Interview.
 */

const models = require('../models')
// const logger = require('../common/logger')
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
      interviewee_name: (interview.guestNames).join(','),
      interviewer_name: interview.hostName,
      xai_template: '/' + interview.templateUrl,
      additional_interviewers: (interview.guestEmails).join(','),
      interview_length: interview.duration,
      job_name: job.title
    }
  })
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
