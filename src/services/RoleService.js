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

const Role = models.Role
const esClient = helper.getESClient()

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
async function getRole (id, fromDb = false) {
  if (!fromDb) {
    try {
      const role = await esClient.get({
        index: config.esConfig.ES_INDEX_ROLE,
        id
      })
      return { id: role.body._id, ...role.body._source }
    } catch (err) {
      if (helper.isDocumentMissingException(err)) {
        throw new errors.NotFoundError(`id: ${id} "Role" not found`)
      }
    }
  }
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

  const created = await Role.create(role)

  await helper.postEvent(config.TAAS_ROLE_CREATE_TOPIC, created.toJSON())
  return created.toJSON()
}

createRole.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  role: Joi.object().keys({
    name: Joi.string().max(50).required(),
    description: Joi.string().max(1000),
    listOfSkills: Joi.array().items(Joi.string().max(50).required()),
    rates: Joi.array().items(Joi.object().keys({
      global: Joi.smallint().required(),
      inCountry: Joi.smallint().required(),
      offShore: Joi.smallint().required(),
      rate30Global: Joi.smallint(),
      rate30InCountry: Joi.smallint(),
      rate30OffShore: Joi.smallint(),
      rate20Global: Joi.smallint(),
      rate20InCountry: Joi.smallint(),
      rate20OffShore: Joi.smallint()
    }).required()).required(),
    numberOfMembers: Joi.number(),
    numberOfMembersAvailable: Joi.smallint(),
    imageUrl: Joi.string().uri().max(255),
    timeToCandidate: Joi.smallint(),
    timeToInterview: Joi.smallint()
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
  const updated = await role.update(data)

  await helper.postEvent(config.TAAS_ROLE_UPDATE_TOPIC, updated.toJSON(), { oldValue: oldValue })
  return updated.toJSON()
}

updateRole.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  id: Joi.string().uuid().required(),
  data: Joi.object().keys({
    name: Joi.string().max(50),
    description: Joi.string().max(1000).allow(null),
    listOfSkills: Joi.array().items(Joi.string().max(50).required()).allow(null),
    rates: Joi.array().items(Joi.object().keys({
      global: Joi.smallint().required(),
      inCountry: Joi.smallint().required(),
      offShore: Joi.smallint().required(),
      rate30Global: Joi.smallint(),
      rate30InCountry: Joi.smallint(),
      rate30OffShore: Joi.smallint(),
      rate20Global: Joi.smallint(),
      rate20InCountry: Joi.smallint(),
      rate20OffShore: Joi.smallint()
    }).required()),
    numberOfMembers: Joi.number().allow(null),
    numberOfMembersAvailable: Joi.smallint().allow(null),
    imageUrl: Joi.string().uri().max(255).allow(null),
    timeToCandidate: Joi.smallint().allow(null),
    timeToInterview: Joi.smallint().allow(null)
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
  await role.destroy()
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
  try {
    const esQuery = {
      index: config.get('esConfig.ES_INDEX_ROLE'),
      body: {
        query: {
          bool: {
            must: []
          }
        },
        size: 10000,
        sort: [{ name: { order: 'asc' } }]
      }
    }
    // Apply skill name filters. listOfSkills array should include all skills provided in criteria.
    _.each(criteria.skillsList, skill => {
      esQuery.body.query.bool.must.push({
        term: {
          listOfSkills: skill
        }
      })
    })
    // Apply name filter, allow partial match
    if (criteria.keyword) {
      esQuery.body.query.bool.must.push({
        wildcard: {
          name: `*${criteria.keyword}*`

        }
      })
    }
    logger.debug({ component: 'RoleService', context: 'searchRoles', message: `Query: ${JSON.stringify(esQuery)}` })

    const { body } = await esClient.search(esQuery)
    return _.map(body.hits.hits, (hit) => _.assign(hit._source, { id: hit._id }))
  } catch (err) {
    logger.logFullError(err, { component: 'RoleService', context: 'searchRoles' })
  }
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
