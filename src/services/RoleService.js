/**
 * This service provides operations of Role.
 */

const _ = require('lodash')
const Joi = require('joi')
const { Op } = require('sequelize')
const { v4: uuid } = require('uuid')
const helper = require('../common/helper')
const logger = require('../common/logger')
const errors = require('../common/errors')
const models = require('../models')

const Role = models.Role

/**
  * Get role by id
  * @param {Object} currentUser the user who perform this operation.
  * @param {String} id the role id
  * @param {Boolean} fromDb flag if query db for data or not
  * @returns {Object} the Role
  */
async function getRole (currentUser, id, fromDb = true) {
  logger.info({ component: 'RoleService', context: 'getRole', message: 'try to query db for data' })
  const role = await Role.findById(id, true)

  // role.dataValues.rates  = role.dataValues.rates.map(rate => JSON.parse(rate))
  return role.dataValues
}

getRole.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  id: Joi.string().guid().required(),
  fromDb: Joi.boolean()
}).required()

/**
  * Create role. Only Booking Manager and Admin can create a role.
  * @params {Object} currentUser the user who perform this operation
  * @params {Object} role the role to be created
  * @returns {Object} the created role
  */
async function createRole (currentUser, role) {
  // check user permission administrator
  const isBookingmanager = currentUser.roles.includes('bookingmanager')
  const isAdmin = currentUser.roles.includes('administrator')
  if (!isAdmin && !isBookingmanager) {
    throw new errors.ForbiddenError('You are not allowed to perform this action!')
  }

  logger.info({ component: 'RoleService', context: 'role new', message: role })

  // check if rates obj has all fields
  const rates = role.rates
  let validRrates = true
  rates.forEach(rate => {
    if (!rate.global || !rate.inCountry || !rate.offShore) {
      validRrates = false
    }
  })

  if (!validRrates) {
    throw new errors.UnprocessableEntityError('Invalid rates!')
  }

  logger.info({ component: 'RoleService', context: 'role new stringify', message: role })
  role.id = uuid()
  role.createdBy = await helper.getUserId(currentUser.userId)

  const created = await Role.create(role)

  logger.info({ component: 'RoleService', context: 'delcreateeteRole', message: created })
  // await helper.postEvent(config.TAAS_ROLE_CREATE_TOPIC, created.toJSON())
  return created.toJSON()
}
//  Joi.array().items(Joi.string()).allow(null),
createRole.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  role: Joi.object().keys({
    name: Joi.string().required(),
    description: Joi.stringAllowEmpty().allow(null),
    skills: Joi.array().items(Joi.string()),
    // rates:Joi.stringAllowEmpty().allow(null),
    // rates:Joi.stringAllowEmpty().required(),
    rates: Joi.array().items(Joi.object().keys({
      global: Joi.number().required(),
      inCountry: Joi.number().required(),
      offShore: Joi.number().required()
    })).required(),
    // rates: Joi.array().items(Joi.number().integer()).required(),
    numMembers: Joi.number().integer(),
    imageUrl: Joi.string().required(),
    timeToCandidate: Joi.number().integer(),
    timeToInterview: Joi.number().integer()
  }).required()
}).required()

/**
  * Update role. Normal user can only update the role he/she created.
  * @params {Object} currentUser the user who perform this operation
  * @params {String} role id
  * @params {Object} data the data to be updated
  * @returns {Object} the updated role
  */
async function updateRole (currentUser, id, data) {
  // check user permission
  const isBookingmanager = currentUser.roles.includes('bookingmanager')
  const isAdmin = currentUser.roles.includes('administrator')
  if (!isAdmin && !isBookingmanager) {
    throw new errors.ForbiddenError('You are not allowed to perform this action!')
  }
  if (data.rates) {
    // check if rates obj has all fields
    const rates = data.rates
    let validRrates = true
    rates.forEach(rate => {
      if (!rate.inCountry || !rate.global || !rate.offShore) {
        validRrates = false
      }
    })
    if (!validRrates) {
      throw new errors.UnprocessableEntityError('Invalid rates!')
    }
  }
  logger.info({ component: 'RoleService', context: 'updateRole', message: 'try to query db for update role  data' })

  let role = await Role.findById(id)
  // const oldValue = role.toJSON()

  const ubahnUserId = await helper.getUserId(currentUser.userId)
  data.updatedBy = ubahnUserId

  await role.update(data)
  // await helper.postEvent(config.TAAS_ROLE_UPDATE_TOPIC, updated.toJSON(), { oldValue: oldValue })
  role = await Role.findById(id, true)
  return role.dataValues
}

/**
  * Partially update role by id
  * @params {Object} currentUser the user who perform this operation
  * @params {String} id the role id
  * @params {Object} data the data to be updated
  * @returns {Object} the updated role
  */
async function partiallyUpdateRole (currentUser, id, data) {
  return updateRole(currentUser, id, data)
}

partiallyUpdateRole.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  id: Joi.string().guid().required(),
  data: Joi.object().keys({
    name: Joi.string().required().allow(null),
    description: Joi.stringAllowEmpty().allow(null),
    skills: Joi.array().items(Joi.string()).allow(null),
    rates: Joi.array().items(Joi.object().keys({
      global: Joi.number().required(),
      inCountry: Joi.number().required(),
      offShore: Joi.number().required()
    })),
    numMembers: Joi.number().integer().allow(null),
    imageUrl: Joi.string().allow(null),
    timeToCandidate: Joi.number().integer().allow(null),
    timeToInterview: Joi.number().integer().allow(null)
  }).required()
}).required()

/**
  * Delete role by id.
  * @params {Object} currentUser the user who perform this operation
  * @params {String} id the role id
  */
async function deleteRole (currentUser, id) {
  // check user permission
  const isBookingmanager = currentUser.roles.includes('bookingmanager')
  const isAdmin = currentUser.roles.includes('administrator')
  if (!isAdmin && !isBookingmanager) {
    throw new errors.ForbiddenError('You are not allowed to perform this action!')
  }

  logger.info({ component: 'RoleService', context: 'deleteRole', message: id })

  const role = await Role.findById(id)
  await role.destroy()
  // await helper.postEvent(config.TAAS_ROLE_DELETE_TOPIC, { id })
}

deleteRole.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  id: Joi.string().guid().required()
}).required()

/**
  * List roles
  * @param {Object} currentUser the user who perform this operation.
  * @params {Object} criteria the search criteria
  * @params {Object} options the extra options to control the function
  * @returns {Object} the search result, contain total/page/perPage and result array
  */
async function searchRoles (currentUser, criteria, options = { returnAll: true }) {
  const page = 1
  const perPage = 10000
  if (!criteria.sortBy) {
    criteria.sortBy = 'name'
  }
  if (!criteria.sortOrder) {
    criteria.sortOrder = 'asc'
  }

  const filter = {}
  if (criteria.keyword) {
    filter.name = {
      [Op.iLike]: `%${criteria.keyword}%`
    }
  }
  if (criteria.skillsList) {
    filter.skills = {
      [Op.contains]: [criteria.skillsList.split(',')]
    }
  }

  const roles = await Role.findAll({
    where: filter,
    offset: ((page - 1) * perPage),
    limit: perPage,
    order: [[criteria.sortBy, criteria.sortOrder]]
  })
  return {
    fromDb: true,
    total: roles.length,
    page,
    perPage,
    result: _.map(roles, role => role.dataValues)
  }
}

module.exports = {
  getRole,
  createRole,
  partiallyUpdateRole,
  deleteRole,
  searchRoles
}
