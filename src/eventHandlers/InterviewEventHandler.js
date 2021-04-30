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
  // get the Interviewer
  const interviewerUsers = await helper.getMemberDetailsByEmails(interview.attendeesList)
    .then((members) => _.map(members, (member) => ({ ...member, emailLowerCase: member.email.toLowerCase() })))
  // get job candidate user details
  const jobCandidate = await models.JobCandidate.findById(interview.jobCandidateId)
  const jobCandidateUser = await helper.getUserById(jobCandidate.userId)
  const jobCandidateMember = await helper.getUserByHandle(jobCandidateUser.handle)
  // get customer details
  const job = await jobCandidate.getJob()

  teamService.sendEmail({}, {
    template: 'interview-invitation',
    cc: [jobCandidateMember.email, ...interview.attendeesList],
    data: {
      job_candidate_id: interview.jobCandidateId,
      interview_round: interview.round,
      interviewee_name: `${jobCandidateMember.firstName} ${jobCandidateMember.lastName}`,
      interviewer_name: `${interviewerUsers[0].firstName} ${interviewerUsers[0].lastName}`,
      xai_template: '/' + interview.xaiTemplate,
      additional_interviewers: (interview.attendeesList).join(','),
      interview_length: Interviews.XaiTemplate[interview.xaiTemplate],
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
