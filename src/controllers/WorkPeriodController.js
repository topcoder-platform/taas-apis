/**
 * Controller for WorkPeriod endpoints
 */
const HttpStatus = require('http-status-codes')
const service = require('../services/WorkPeriodService')
const helper = require('../common/helper')

/**
 * Get workPeriod by id
 * @param req the request
 * @param res the response
 */
async function getWorkPeriod (req, res) {
  res.send(await service.getWorkPeriod(req.authUser, req.params.id, req.query.fromDb))
}

/**
 * Create workPeriod
 * @param req the request
 * @param res the response
 */
async function createWorkPeriod (req, res) {
  res.send(await service.createWorkPeriod(req.authUser, req.body))
}

/**
 * Partially update workPeriod by id
 * @param req the request
 * @param res the response
 */
async function partiallyUpdateWorkPeriod (req, res) {
  res.send(await service.partiallyUpdateWorkPeriod(req.authUser, req.params.id, req.body))
}

/**
 * Fully update workPeriod by id
 * @param req the request
 * @param res the response
 */
async function fullyUpdateWorkPeriod (req, res) {
  res.send(await service.fullyUpdateWorkPeriod(req.authUser, req.params.id, req.body))
}

/**
 * Delete workPeriod by id
 * @param req the request
 * @param res the response
 */
async function deleteWorkPeriod (req, res) {
  await service.deleteWorkPeriod(req.authUser, req.params.id)
  res.status(HttpStatus.NO_CONTENT).end()
}

/**
 * Search workPeriods
 * @param req the request
 * @param res the response
 */
async function searchWorkPeriods (req, res) {
  const result = await service.searchWorkPeriods(req.authUser, req.query)
  helper.setResHeaders(req, res, result)
  res.send(result.result)
}

module.exports = {
  getWorkPeriod,
  createWorkPeriod,
  partiallyUpdateWorkPeriod,
  fullyUpdateWorkPeriod,
  deleteWorkPeriod,
  searchWorkPeriods
}
