/**
 * Controller for ResourceBooking endpoints
 */
const HttpStatus = require('http-status-codes')
const service = require('../services/ResourceBookingService')
const helper = require('../common/helper')

/**
 * Get resourceBooking by id
 * @param req the request
 * @param res the response
 */
async function getResourceBooking (req, res) {
  res.send(await service.getResourceBooking(req.authUser, req.params.id, req.query.fromDb))
}

/**
 * Create resourceBooking
 * @param req the request
 * @param res the response
 */
async function createResourceBooking (req, res) {
  res.send(await service.createResourceBooking(req.authUser, req.body))
}

/**
 * Partially update resourceBooking by id
 * @param req the request
 * @param res the response
 */
async function partiallyUpdateResourceBooking (req, res) {
  res.send(await service.partiallyUpdateResourceBooking(req.authUser, req.params.id, req.body))
}

/**
 * Fully update resourceBooking by id
 * @param req the request
 * @param res the response
 */
async function fullyUpdateResourceBooking (req, res) {
  res.send(await service.fullyUpdateResourceBooking(req.authUser, req.params.id, req.body))
}

/**
 * Delete resourceBooking by id
 * @param req the request
 * @param res the response
 */
async function deleteResourceBooking (req, res) {
  await service.deleteResourceBooking(req.authUser, req.params.id)
  res.status(HttpStatus.NO_CONTENT).end()
}

/**
 * Search resourceBookings
 * @param req the request
 * @param res the response
 */
async function searchResourceBookings (req, res) {
  const result = await service.searchResourceBookings(req.query)
  helper.setResHeaders(req, res, result)
  res.send(result.result)
}

module.exports = {
  getResourceBooking,
  createResourceBooking,
  partiallyUpdateResourceBooking,
  fullyUpdateResourceBooking,
  deleteResourceBooking,
  searchResourceBookings
}
