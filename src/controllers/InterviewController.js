/**
 * Controller for Interview endpoints
 */
const service = require('../services/InterviewService')
const helper = require('../common/helper')

/**
 * Get interview by round
 * @param req the request
 * @param res the response
 */
async function getInterviewByRound (req, res) {
  const { jobCandidateId, round } = req.params
  res.send(await service.getInterviewByRound(req.authUser, jobCandidateId, round, req.query.fromDb))
}

/**
 * Request interview
 * @param req the request
 * @param res the response
 */
async function requestInterview (req, res) {
  res.send(await service.requestInterview(req.authUser, req.params.jobCandidateId, req.body))
}

/**
 * Search interviews
 * @param req the request
 * @param res the response
 */
async function searchInterviews (req, res) {
  const result = await service.searchInterviews(req.authUser, req.params.jobCandidateId, req.query)
  helper.setResHeaders(req, res, result)
  res.send(result.result)
}

module.exports = {
  getInterviewByRound,
  requestInterview,
  searchInterviews
}
