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
  const jobCandidateUser = await helper.getUserById(jobCandidate.userId, true)
  // const jobCandidateUserEmail = helper.getUserAttributeValue(jobCandidateUser, 'email')
  // get customer details
  const job = await jobCandidate.getJob()
  // const customerUser = await helper.getUserByExternalId(job.externalId, true)
  // const customerUserEmail = helper.getUserAttributeValue(customerUser, 'email')

  // TODO: remove mock addresses & switch back to the old implementation once API gets fixed
  // Both emails will be undefined since TC API doesn't return attributes,
  // this is a workaround to skip check/condition & log the payload
  // it will post the event nevertheless (with mocked candidate&customer address), so you can see on the logs as kafka event
  // and verify the payload content
  const customerMockEmail = 'testcustomer@yopmail.com'
  const candidateMockEmail = 'testuserforemail@yopmail.com'

  // if (jobCandidateUserEmail && customerUserEmail) {
  const interviewerList = interview.attendeesList
    // ? [customerUserEmail, ...interview.attendeesList].join(', ') // "customer@mail.com, first@attendee.com, second@attendee.com..."
    // : customerUserEmail
    ? [customerMockEmail, ...interview.attendeesList].join(', ') // "customer@mail.com, first@attendee.com, second@attendee.com..."
    : customerMockEmail
  teamService.sendEmail({}, {
    template: 'interview-invitation',
    recipients: [candidateMockEmail, customerMockEmail],
    cc: interview.attendeesList,
    data: {
      interviewType: interview.xaiTemplate,
      interviewRound: interview.round,
      interviewDuration: Interviews.XaiTemplate[interview.xaiTemplate],
      interviewerList,
      jobName: job.title,
      candidateName: `${jobCandidateUser.firstName} ${jobCandidateUser.lastName}`,
      candidateId: interview.jobCandidateId
    }
  })
  /* } else {
    // one (or both) of the emails are missing due to some reason
    // for e.g. some users' externalIds may be set to null or similar
    // log error
    logger.error({
      component: 'InterviewEventHandler',
      context: 'sendInvitationEmail',
      message: 'Couldn\'t sent invitation emails. Insufficient details.'
    })
  } */
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
