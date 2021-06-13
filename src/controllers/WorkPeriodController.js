/**
 * Controller for WorkPeriod endpoints
 */
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
 * Partially update workPeriod by id
 * @param req the request
 * @param res the response
 */
async function partiallyUpdateWorkPeriod (req, res) {
  res.send(await service.partiallyUpdateWorkPeriod(req.authUser, req.params.id, req.body))
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
  partiallyUpdateWorkPeriod,
  searchWorkPeriods
}
