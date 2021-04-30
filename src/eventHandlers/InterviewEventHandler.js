/*
 * Handle events for Interview.
 */

const models = require('../models')
// const logger = require('../common/logger')
const helper = require('../common/helper')
const { Interviews } = require('../../app-constants')
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
  const jobCandidateUserEmail = await helper.getUserByHandle(jobCandidateUser.handle)
  // get customer details
  const job = await jobCandidate.getJob()

  teamService.sendEmail({}, {
    template: 'interview-invitation',
    cc: [jobCandidateUserEmail.email, ...interview.attendeesList],
    data: {
      job_candidate_id: interview.jobCandidateId,
      interview_round: interview.round,
      interviewee_name: `${jobCandidateUser.firstName} ${jobCandidateUser.lastName}`,
      interviewer_name: `${jobCandidateUserEmail.firstName} ${jobCandidateUserEmail.lastName}`,
      xai_template: interview.xaiTemplate,
      additional_interviewers: interview.attendeesList,
      interview_length: Interviews.XaiTemplate[interview.xaiTemplate],
      job_name: job.title,
      interviewee_handle: jobCandidateUserEmail.handle
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
