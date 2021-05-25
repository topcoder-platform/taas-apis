/**
 * Controller for Role  endpoints
 */
const HttpStatus = require('http-status-codes')
const service = require('../services/RoleService')
const helper = require('../common/helper')

/**
 * Get Role by id
 * @param req the request
 * @param res the response
 */
async function getRole (req, res) {
  res.send(await service.getRole(req.authUser, req.params.id, req.query.fromDb))
}

/**
 * Create Role
 * @param req the request
 * @param res the response
 */
async function createRole (req, res) {
  res.send(await service.createRole(req.authUser, req.body))
}

/**
 * Partially update Role by id
 * @param req the request
 * @param res the response
 */
async function partiallyUpdateRole (req, res) {
  res.send(await service.partiallyUpdateRole(req.authUser, req.params.id, req.body))
}

/**
 * Delete Role  by id
 * @param req the request
 * @param res the response
 */
async function deleteRole (req, res) {
  await service.deleteRole(req.authUser, req.params.id)
  res.status(HttpStatus.NO_CONTENT).end()
}

/**
 * Search Roles
 * @param req the request
 * @param res the response
 */
async function searchRoles (req, res) {
  const result = await service.searchRoles(req.authUser, req.query)
  helper.setResHeaders(req, res, result)
  res.send(result.result)
}

module.exports = {
  getRole,
  createRole,
  partiallyUpdateRole,
  deleteRole,
  searchRoles
}
