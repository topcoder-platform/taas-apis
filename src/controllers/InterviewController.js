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
 * Get interview by id
 * @param req the request
 * @param res the response
 */
async function getInterviewById (req, res) {
  res.send(await service.getInterviewById(req.authUser, req.params.id, req.query.fromDb))
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
 * Patch (partially update) interview by round
 * @param req the request
 * @param res the response
 */
async function partiallyUpdateInterviewByRound (req, res) {
  const { jobCandidateId, round } = req.params
  res.send(await service.partiallyUpdateInterviewByRound(req.authUser, jobCandidateId, round, req.body))
}

/**
 * Patch (partially update) interview by id
 * @param req the request
 * @param res the response
 */
async function partiallyUpdateInterviewById (req, res) {
  res.send(await service.partiallyUpdateInterviewById(req.authUser, req.params.id, req.body))
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
  getInterviewById,
  requestInterview,
  partiallyUpdateInterviewByRound,
  partiallyUpdateInterviewById,
  searchInterviews
}
