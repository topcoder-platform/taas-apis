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
  // get job candidate user details
  const jobCandidate = await models.JobCandidate.findById(interview.jobCandidateId)
  const jobCandidateUser = await helper.getUserById(jobCandidate.userId)
  const jobCandidateMember = await helper.getUserByHandle(jobCandidateUser.handle)
  // get customer details
  const job = await jobCandidate.getJob()

  teamService.sendEmail({}, {
    template: 'interview-invitation',
    cc: [jobCandidateMember.email, ...interview.guestEmails],
    data: {
      interview_id: interview.id,
      interviewee_name: `${jobCandidateMember.firstName} ${jobCandidateMember.lastName}`,
      interviewer_name: interview.hostName,
      xai_template: '/' + interview.templateUrl,
      additional_interviewers: (interview.guestEmails).join(','),
      interview_length: interview.duration,
      job_name: job.title,
      interviewee_handle: jobCandidateMember.handle
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
