/**
 * This service provides operations of Skill.
 */
const Joi = require('joi')
const helper = require('../common/helper')

/**
 * Search skills
 * @param {Object} criteria the search criteria
 * @returns {Object} the search result, contain total/page/perPage and result array
 */
async function searchSkills (criteria) {
  return helper.getSkills(criteria)
}

searchSkills.schema = Joi.object().keys({
  criteria: Joi.object().keys({
    page: Joi.page(),
    perPage: Joi.perPage(),
    orderBy: Joi.string()
  }).required()
}).required()

module.exports = {
  searchSkills
}
