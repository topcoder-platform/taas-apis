/**
 * Controller for WorkPeriodPayment endpoints
 */
const service = require('../services/WorkPeriodPaymentService')
const helper = require('../common/helper')

/**
 * Get workPeriodPayment by id
 * @param req the request
 * @param res the response
 */
async function getWorkPeriodPayment (req, res) {
  res.send(await service.getWorkPeriodPayment(req.authUser, req.params.id, req.query.fromDb))
}

/**
 * Create workPeriodPayment
 * @param req the request
 * @param res the response
 */
async function createWorkPeriodPayment (req, res) {
  res.send(await service.createWorkPeriodPayment(req.authUser, req.body))
}

/**
 * Partially update workPeriodPayment by id
 * @param req the request
 * @param res the response
 */
async function partiallyUpdateWorkPeriodPayment (req, res) {
  res.send(await service.partiallyUpdateWorkPeriodPayment(req.authUser, req.params.id, req.body))
}

/**
 * Search workPeriodPayments
 * @param req the request
 * @param res the response
 */
async function searchWorkPeriodPayments (req, res) {
  const result = await service.searchWorkPeriodPayments(req.authUser, req.query)
  helper.setResHeaders(req, res, result)
  res.send(result.result)
}

/**
 * Create all query workPeriodPayments
 * @param req the request
 * @param res the response
 */
async function createQueryWorkPeriodPayments (req, res) {
  res.send(await service.createQueryWorkPeriodPayments(req.authUser, req.body))
}

module.exports = {
  getWorkPeriodPayment,
  createWorkPeriodPayment,
  createQueryWorkPeriodPayments,
  partiallyUpdateWorkPeriodPayment,
  searchWorkPeriodPayments
}
