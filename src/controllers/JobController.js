/**
 * Controller for Job endpoints
 */
const HttpStatus = require('http-status-codes')
const service = require('../services/JobService')
const helper = require('../common/helper')

/**
 * Get job by id
 * @param req the request
 * @param res the response
 */
async function getJob (req, res) {
  res.send(await service.getJob(req.authUser, req.params.id, req.query.fromDb))
}

/**
 * Create job
 * @param req the request
 * @param res the response
 */
async function createJob (req, res) {
  res.send(await service.createJob(req.authUser, req.body))
}

/**
 * Partially update job by id
 * @param req the request
 * @param res the response
 */
async function partiallyUpdateJob (req, res) {
  res.send(await service.partiallyUpdateJob(req.authUser, req.params.id, req.body))
}

/**
 * Fully update job by id
 * @param req the request
 * @param res the response
 */
async function fullyUpdateJob (req, res) {
  res.send(await service.fullyUpdateJob(req.authUser, req.params.id, req.body))
}

/**
 * Delete job by id
 * @param req the request
 * @param res the response
 */
async function deleteJob (req, res) {
  await service.deleteJob(req.authUser, req.params.id)
  res.status(HttpStatus.NO_CONTENT).end()
}

/**
 * Search jobs
 * @param req the request
 * @param res the response
 */
async function searchJobs (req, res) {
  if (req.body && req.body.jobIds) {
    req.query.jobIds = req.body.jobIds
  }
  const result = await service.searchJobs(req.authUser, req.query)
  if (req.query.jobIds) {
    delete req.query.jobIds
  }
  helper.setResHeaders(req, res, result)
  res.send(result.result)
}

module.exports = {
  getJob,
  createJob,
  partiallyUpdateJob,
  fullyUpdateJob,
  deleteJob,
  searchJobs
}
