/**
 * Controller for skills endpoints
 */
const service = require('../services/SkillService')
const helper = require('../common/helper')

/**
 * Search skills
 * @param req the request
 * @param res the response
 */
async function searchSkills (req, res) {
  const result = await service.searchSkills(req.query)
  helper.setResHeaders(req, res, result)
  res.send(result.result)
}

/**
 * Get V5 U-bahn user by handle
 * If user doesn't exists in V5 it creates it
 *
 * @param req the request
 * @param res the response
 */
async function getUserByHandle (req, res) {
  res.send(await service.getUserByHandle(req.params.handle))
}

module.exports = {
  searchSkills,
  getUserByHandle
}
