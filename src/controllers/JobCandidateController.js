/**
 * Controller for JobCandidate endpoints
 */
const HttpStatus = require('http-status-codes')
const service = require('../services/JobCandidateService')
const helper = require('../common/helper')

/**
 * Get jobCandidate by id
 * @param req the request
 * @param res the response
 */
async function getJobCandidate (req, res) {
  res.send(await service.getJobCandidate(req.params.id, req.query.fromDb))
}

/**
 * Create jobCandidate
 * @param req the request
 * @param res the response
 */
async function createJobCandidate (req, res) {
  res.send(await service.createJobCandidate(req.authUser, req.body))
}

/**
 * Partially update jobCandidate by id
 * @param req the request
 * @param res the response
 */
async function partiallyUpdateJobCandidate (req, res) {
  res.send(await service.partiallyUpdateJobCandidate(req.authUser, req.params.id, req.body))
}

/**
 * Fully update jobCandidate by id
 * @param req the request
 * @param res the response
 */
async function fullyUpdateJobCandidate (req, res) {
  res.send(await service.fullyUpdateJobCandidate(req.authUser, req.params.id, req.body))
}

/**
 * Delete jobCandidate by id
 * @param req the request
 * @param res the response
 */
async function deleteJobCandidate (req, res) {
  await service.deleteJobCandidate(req.authUser, req.params.id)
  res.status(HttpStatus.NO_CONTENT).end()
}

/**
 * Search jobCandidates
 * @param req the request
 * @param res the response
 */
async function searchJobCandidates (req, res) {
  const result = await service.searchJobCandidates(req.query)
  helper.setResHeaders(req, res, result)
  res.send({ result: result.result })
}

module.exports = {
  getJobCandidate,
  createJobCandidate,
  partiallyUpdateJobCandidate,
  fullyUpdateJobCandidate,
  deleteJobCandidate,
  searchJobCandidates
}
