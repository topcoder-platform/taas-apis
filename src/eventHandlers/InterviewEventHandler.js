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
  const jobCandidateUserEmail = await helper.getUserEmailByHandle(jobCandidateUser.handle)
  // get customer details
  const job = await jobCandidate.getJob()

  teamService.sendEmail({}, {
    template: 'interview-invitation',
    cc: [jobCandidateUserEmail, ...interview.attendeesList],
    data: {
      interviewType: interview.xaiTemplate,
      interviewRound: interview.round,
      interviewDuration: Interviews.XaiTemplate[interview.xaiTemplate],
      interviewerList: interview.attendeesList,
      jobName: job.title,
      candidateName: `${jobCandidateUser.firstName} ${jobCandidateUser.lastName}`,
      candidateId: interview.jobCandidateId
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
