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

module.exports = {
  searchSkills
}
