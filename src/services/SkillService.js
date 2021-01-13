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
  return helper.getTopcoderSkills(criteria)
}

searchSkills.schema = Joi.object().keys({
  criteria: Joi.object().keys({
    page: Joi.page(),
    perPage: Joi.perPage(),
    orderBy: Joi.string()
  }).required()
}).required()

/**
 * Get V5 U-bahn user by handle
 * If user doesn't exists in V5 it creates it
 *
 * @param {Object} handle      user handle
 *
 * @returns {Object} V5 user
 */
async function getUserByHandle(handle) {
  const v3User = await helper.getMemberByHandle(handle);
  const v5userId = await helper.getUserId(v3User.userId);

  return {
    userId: v5userId
  };
}

module.exports = {
  searchSkills,
  getUserByHandle,
}
