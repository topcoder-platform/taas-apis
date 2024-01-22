/**
 * This service provides operations of Roles.
 */

const _ = require('lodash')
const config = require('config')
const Joi = require('joi')
const { Op } = require('sequelize')
const uuid = require('uuid')
const helper = require('../common/helper')
const logger = require('../common/logger')
const errors = require('../common/errors')
const models = require('../models')

const sequelize = models.sequelize
const Role = models.Role

/**
  * Check user permission for deleting, creating or updating role.
  * @param {Object} currentUser the user who perform this operation.
  * @returns {undefined}
  */
async function _checkUserPermissionForWriteDeleteRole (currentUser) {
  if (!currentUser.hasManagePermission && !currentUser.isMachine) {
    throw new errors.ForbiddenError('You are not allowed to perform this action!')
  }
}

/**
  * Cleans and validates skill names using skills service
  * @param {Array<string>} skills array of skill names to validate
  * @returns {undefined}
  */
async function _cleanAndValidateSkillNames (skills) {
  // remove duplicates, leading and trailing whitespaces, empties.
  const cleanedSkills = _.uniq(_.filter(_.map(skills, skill => _.trim(skill)), skill => !_.isEmpty(skill)))
  if (cleanedSkills.length > 0) {
    // search skills if they are exists
    const result = await helper.getAllTopcoderSkills({ name: _.join(cleanedSkills, ',') })
    const skillNames = _.map(result, 'name')
    // find skills that not valid
    const unValidSkills = _.differenceBy(cleanedSkills, skillNames, _.toLower)
    if (unValidSkills.length > 0) {
      throw new errors.BadRequestError(`skills: "${unValidSkills}" are not valid`)
    }
    return _.intersectionBy(skillNames, cleanedSkills, _.toLower)
  } else {
    return null
  }
}

/**
  * Check user permission for deleting, creating or updating role.
  * @param {Object} currentUser the user who perform this operation.
  * @returns {undefined}
  */
async function _checkIfSameNamedRoleExists (roleName) {
  // We can't create another Role with the same name
  const role = await Role.findOne({
    where: {
      name: { [Op.iLike]: roleName }
    },
    raw: true
  })
  if (role) {
    throw new errors.BadRequestError(`Role: "${role.name}" is already exists.`)
  }
}

/**
  * Get role by id
  * @param {Object} currentUser the user who perform this operation.
  * @param {String} id the role id
  * @param {Boolean} fromDb flag if query db for data or not
  * @returns {Object} the role
  */
async function getRole (id) {
  logger.info({ component: 'RoleService', context: 'getRole', message: 'try to query db for data' })
  const role = await Role.findById(id)

  return role.toJSON()
}

getRole.schema = Joi.object().keys({
  id: Joi.string().uuid().required(),
  fromDb: Joi.boolean()
}).required()

/**
  * Create role
  * @param {Object} currentUser the user who perform this operation
  * @param {Object} role the role to be created
  * @returns {Object} the created role
  */
async function createRole (currentUser, role) {
  // check permission
  await _checkUserPermissionForWriteDeleteRole(currentUser)
  // check if another Role with the same name exists.
  await _checkIfSameNamedRoleExists(role.name)
  // clean and validate skill names
  if (role.listOfSkills) {
    role.listOfSkills = await _cleanAndValidateSkillNames(role.listOfSkills)
  }

  role.id = uuid.v4()
  role.createdBy = await helper.getUserId(currentUser.userId)

  let entity
  try {
    await sequelize.transaction(async (t) => {
      const created = await Role.create(role, { transaction: t })
      entity = created.toJSON()
    })
  } catch (e) {
    if (entity) {
      helper.postErrorEvent(config.TAAS_ERROR_TOPIC, entity, 'role.create')
    }
    throw e
  }
  await helper.postEvent(config.TAAS_ROLE_CREATE_TOPIC, entity)
  return entity
}

createRole.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  role: Joi.object().keys({
    name: Joi.string().max(50).required(),
    description: Joi.string().max(1000),
    listOfSkills: Joi.array().items(Joi.string().max(50).required()),
    rates: Joi.array().items(Joi.object().keys({
      global: Joi.smallint().min(1),
      inCountry: Joi.smallint().min(1),
      offShore: Joi.smallint().min(1),
      niche: Joi.smallint().min(1),
      rate30Niche: Joi.smallint().min(1),
      rate30Global: Joi.smallint().min(1),
      rate30InCountry: Joi.smallint().min(1),
      rate30OffShore: Joi.smallint().min(1),
      rate20Niche: Joi.smallint().min(1),
      rate20Global: Joi.smallint().min(1),
      rate20InCountry: Joi.smallint().min(1),
      rate20OffShore: Joi.smallint().min(1)
    }).required()).required(),
    numberOfMembers: Joi.number().integer().min(1),
    numberOfMembersAvailable: Joi.smallint().min(1),
    imageUrl: Joi.string().uri().max(255),
    timeToCandidate: Joi.smallint().min(1),
    timeToInterview: Joi.smallint().min(1)
  }).required()
}).required()

/**
  * Partially Update role
  * @param {Object} currentUser the user who perform this operation
  * @param {String} id the role id
  * @param {Object} data the data to be updated
  * @returns {Object} the updated role
  */
async function updateRole (currentUser, id, data) {
  // check permission
  await _checkUserPermissionForWriteDeleteRole(currentUser)

  const role = await Role.findById(id)
  const oldValue = role.toJSON()
  // if name is changed, check if another Role with the same name exists.
  if (data.name && data.name.toLowerCase() !== role.dataValues.name.toLowerCase()) {
    await _checkIfSameNamedRoleExists(data.name)
  }
  // clean and validate skill names
  if (data.listOfSkills) {
    data.listOfSkills = await _cleanAndValidateSkillNames(data.listOfSkills)
  }

  data.updatedBy = await helper.getUserId(currentUser.userId)

  let entity
  try {
    await sequelize.transaction(async (t) => {
      const updated = await role.update(data, { transaction: t })
      entity = updated.toJSON()
    })
  } catch (e) {
    if (entity) {
      helper.postErrorEvent(config.TAAS_ERROR_TOPIC, entity, 'role.update')
    }
    throw e
  }
  await helper.postEvent(config.TAAS_RESOURCE_BOOKING_UPDATE_TOPIC, entity, { oldValue: oldValue })
  return entity
}

updateRole.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  id: Joi.string().uuid().required(),
  data: Joi.object().keys({
    name: Joi.string().max(50),
    description: Joi.string().max(1000).allow(null),
    listOfSkills: Joi.array().items(Joi.string().max(50).required()).allow(null),
    rates: Joi.array().items(Joi.object().keys({
      global: Joi.smallint().min(1).required(),
      inCountry: Joi.smallint().min(1).required(),
      offShore: Joi.smallint().min(1).required(),
      niche: Joi.smallint().min(1),
      rate30Niche: Joi.smallint().min(1),
      rate30Global: Joi.smallint().min(1),
      rate30InCountry: Joi.smallint().min(1),
      rate30OffShore: Joi.smallint().min(1),
      rate20Global: Joi.smallint().min(1),
      rate20Niche: Joi.smallint().min(1),
      rate20InCountry: Joi.smallint().min(1),
      rate20OffShore: Joi.smallint().min(1)
    }).required()),
    numberOfMembers: Joi.number().integer().min(1).allow(null),
    numberOfMembersAvailable: Joi.smallint().min(1).allow(null),
    imageUrl: Joi.string().uri().max(255).allow(null),
    timeToCandidate: Joi.smallint().min(1).allow(null),
    timeToInterview: Joi.smallint().min(1).allow(null)
  }).required()
}).required()

/**
  * Delete role by id
  * @param {Object} currentUser the user who perform this operation
  * @param {String} id the role id
  */
async function deleteRole (currentUser, id) {
  // check permission
  await _checkUserPermissionForWriteDeleteRole(currentUser)

  const role = await Role.findById(id)

  try {
    await sequelize.transaction(async (t) => {
      await role.destroy({ transaction: t })
    })
  } catch (e) {
    helper.postErrorEvent(config.TAAS_ERROR_TOPIC, { id }, 'role.delete')
    throw e
  }
  await helper.postEvent(config.TAAS_ROLE_DELETE_TOPIC, { id })
}

deleteRole.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  id: Joi.string().uuid().required()
}).required()

/**
  * List roles
  * @param {Object} currentUser the user who perform this operation.
  * @param {Object} criteria the search criteria
  * @returns {Object} the search result
  */
async function searchRoles (criteria) {
  // clean skill names and convert into an array
  criteria.skillsList = _.filter(_.map(_.split(criteria.skillsList, ','), skill => _.trim(skill)), skill => !_.isEmpty(skill))

  logger.info({ component: 'RoleService', context: 'searchRoles', message: 'fallback to DB query' })
  const filter = { [Op.and]: [] }
  // Apply skill name filters. listOfSkills array should include all skills provided in criteria.
  if (criteria.skillsList) {
    _.each(criteria.skillsList, skill => {
      filter[Op.and].push(models.Sequelize.literal(`LOWER('${skill}') in (SELECT lower(x) FROM unnest("list_of_skills"::text[]) x)`))
    })
  }
  // Apply name filter, allow partial match and ignore case
  if (criteria.keyword) {
    filter[Op.and].push({ name: { [Op.iLike]: `%${criteria.keyword}%` } })
  }
  const queryCriteria = {
    where: filter,
    order: [['name', 'asc']]
  }
  const roles = await Role.findAll(queryCriteria)
  return roles
}

searchRoles.schema = Joi.object().keys({
  criteria: Joi.object().keys({
    skillsList: Joi.string(),
    keyword: Joi.string()
  }).required()
}).required()

module.exports = {
  getRole,
  createRole,
  updateRole,
  deleteRole,
  searchRoles
}
