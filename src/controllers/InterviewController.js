/**
 * Controller for Interview endpoints
 */
const service = require('../services/InterviewService')
const helper = require('../common/helper')
const config = require('config')

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
 * Patch (partially update) interview by Nylas webhook
 * @param req the request
 * @param res the response
 */
async function partiallyUpdateInterviewByWebhook (req, res) {
  res.send(await service.partiallyUpdateInterviewByWebhook(req.params.id, req.query.authToken, req.body))
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

/**
<<<<<<< HEAD
 * Get a fresh Zoom Links from Zoom Meeting and redirect to Zoom Link
 * @param req the request
 * @param res the response
 */
async function getZoomLink (req, res) {
  const zoomLink = await service.getZoomLink(req.params.id, req.query)
  return res.redirect(zoomLink)
=======
 * Handle Nylas Page scheduling webhook
 * Authenticates request using authToken from URL query parameter
 * @param req the request
 * @param res the response
 */
async function handleNylasPageWebhook (req, res) {
  // Verify webhook authentication token
  const authToken = req.query.authToken
  if (!authToken || authToken !== config.NYLAS_WEBHOOK_SECRET) {
    res.status(401).send({ error: 'Unauthorized - Invalid or missing auth token' })
    return
  }
  // Process the webhook
  res.send(await service.handleNylasPageWebhook(req.params.id, req.body))
>>>>>>> f77686c (feat: add authentication for Nylas Page webhooks)
}

module.exports = {
  getInterviewByRound,
  getInterviewById,
  requestInterview,
  partiallyUpdateInterviewByRound,
  partiallyUpdateInterviewById,
  searchInterviews,
<<<<<<< HEAD
  partiallyUpdateInterviewByWebhook,
  getZoomLink
=======
  handleNylasPageWebhook
>>>>>>> f77686c (feat: add authentication for Nylas Page webhooks)
}
