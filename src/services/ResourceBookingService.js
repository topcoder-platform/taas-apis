/**
 * This service provides operations of ResourceBooking.
 */

const _ = require('lodash')
const Joi = require('joi')
const config = require('config')
const HttpStatus = require('http-status-codes')
const { Op } = require('sequelize')
const { v4: uuid } = require('uuid')
const helper = require('../common/helper')
const logger = require('../common/logger')
const errors = require('../common/errors')
const models = require('../models')

const ResourceBooking = models.ResourceBooking
const esClient = helper.getESClient()

/**
 * filter fields of resource booking by user role.
 * @param {Object} currentUser the user who perform this operation.
 * @param {Object} resourceBooking the resourceBooking with all fields
 * @returns {Object} the resourceBooking
 */
async function _getResourceBookingFilteringFields (currentUser, resourceBooking) {
  if (currentUser.hasManagePermission || currentUser.isMachine) {
    return helper.clearObject(resourceBooking)
  }
  return _.omit(helper.clearObject(resourceBooking), 'memberRate')
}

/**
 * Check user permission for getting resource booking.
 *
 * @param {Object} currentUser the user who perform this operation.
 * @param {String} projectId the project id
 * @returns {undefined}
 */
async function _checkUserPermissionForGetResourceBooking (currentUser, projectId) {
  if (!currentUser.hasManagePermission && !currentUser.isMachine && !currentUser.isConnectManager) {
    await helper.checkIsMemberOfProject(currentUser.userId, projectId)
  }
}

/**
 * Get resourceBooking by id
 * @param {Object} currentUser the user who perform this operation.
 * @param {String} id the resourceBooking id
 * @param {Boolean} fromDb flag if query db for data or not
 * @returns {Object} the resourceBooking
 */
async function getResourceBooking (currentUser, id, fromDb = false) {
  if (!fromDb) {
    try {
      const resourceBooking = await esClient.get({
        index: config.esConfig.ES_INDEX_RESOURCE_BOOKING,
        id
      })

      await _checkUserPermissionForGetResourceBooking(currentUser, resourceBooking.body._source.projectId) // check user permission

      const resourceBookingRecord = { id: resourceBooking.body._id, ...resourceBooking.body._source }
      return _getResourceBookingFilteringFields(currentUser, resourceBookingRecord)
    } catch (err) {
      if (helper.isDocumentMissingException(err)) {
        throw new errors.NotFoundError(`id: ${id} "ResourceBooking" not found`)
      }
      if (err.httpStatus === HttpStatus.FORBIDDEN) {
        throw err
      }
      logger.logFullError(err, { component: 'ResourceBookingService', context: 'getResourceBooking' })
    }
  }
  logger.info({ component: 'ResourceBookingService', context: 'getResourceBooking', message: 'try to query db for data' })
  const resourceBooking = await ResourceBooking.findById(id)

  await _checkUserPermissionForGetResourceBooking(currentUser, resourceBooking.projectId) // check user permission

  return _getResourceBookingFilteringFields(currentUser, resourceBooking.dataValues)
}

getResourceBooking.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  id: Joi.string().guid().required(),
  fromDb: Joi.boolean()
}).required()

/**
 * Create resourceBooking
 * @params {Object} currentUser the user who perform this operation
 * @params {Object} resourceBooking the resourceBooking to be created
 * @returns {Object} the created resourceBooking
 */
async function createResourceBooking (currentUser, resourceBooking) {
  // check permission
  if (!currentUser.hasManagePermission && !currentUser.isMachine) {
    throw new errors.ForbiddenError('You are not allowed to perform this action!')
  }

  if (resourceBooking.jobId) {
    await helper.ensureJobById(resourceBooking.jobId) // ensure job exists
  }
  await helper.ensureUserById(resourceBooking.userId) // ensure user exists

  resourceBooking.id = uuid()
  resourceBooking.createdAt = new Date()
  resourceBooking.createdBy = await helper.getUserId(currentUser.userId)
  resourceBooking.status = 'sourcing'

  const created = await ResourceBooking.create(resourceBooking)
  await helper.postEvent(config.TAAS_RESOURCE_BOOKING_CREATE_TOPIC, resourceBooking)
  return helper.clearObject(created.dataValues)
}

createResourceBooking.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  resourceBooking: Joi.object().keys({
    projectId: Joi.number().integer().required(),
    userId: Joi.string().uuid().required(),
    jobId: Joi.string().uuid(),
    startDate: Joi.date(),
    endDate: Joi.date(),
    memberRate: Joi.number(),
    customerRate: Joi.number(),
    rateType: Joi.rateType().required()
  }).required()
}).required()

/**
 * Update resourceBooking
 * @params {Object} currentUser the user who perform this operation
 * @params {String} id the resourceBooking id
 * @params {Object} data the data to be updated
 * @returns {Object} the updated resourceBooking
 */
async function updateResourceBooking (currentUser, id, data) {
  // check permission
  if (!currentUser.hasManagePermission && !currentUser.isMachine) {
    throw new errors.ForbiddenError('You are not allowed to perform this action!')
  }

  const resourceBooking = await ResourceBooking.findById(id)
  const oldValue = resourceBooking.toJSON()

  data.updatedAt = new Date()
  data.updatedBy = await helper.getUserId(currentUser.userId)

  await resourceBooking.update(data)
  await helper.postEvent(config.TAAS_RESOURCE_BOOKING_UPDATE_TOPIC, { id, ...data }, { oldValue: oldValue })
  const result = helper.clearObject(_.assign(resourceBooking.dataValues, data))
  return result
}

/**
 * Partially update resourceBooking by id
 * @params {Object} currentUser the user who perform this operation
 * @params {String} id the resourceBooking id
 * @params {Object} data the data to be updated
 * @returns {Object} the updated resourceBooking
 */
async function partiallyUpdateResourceBooking (currentUser, id, data) {
  return updateResourceBooking(currentUser, id, data)
}

partiallyUpdateResourceBooking.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  id: Joi.string().uuid().required(),
  data: Joi.object().keys({
    status: Joi.jobStatus(),
    startDate: Joi.date(),
    endDate: Joi.date(),
    memberRate: Joi.number(),
    customerRate: Joi.number(),
    rateType: Joi.rateType()
  }).required()
}).required()

/**
 * Fully update resourceBooking by id
 * @params {Object} currentUser the user who perform this operation
 * @params {String} id the resourceBooking id
 * @params {Object} data the data to be updated
 * @returns {Object} the updated resourceBooking
 */
async function fullyUpdateResourceBooking (currentUser, id, data) {
  if (data.jobId) {
    await helper.ensureJobById(data.jobId) // ensure job exists
  }
  await helper.ensureUserById(data.userId) // ensure user exists
  return updateResourceBooking(currentUser, id, data)
}

fullyUpdateResourceBooking.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  id: Joi.string().uuid().required(),
  data: Joi.object().keys({
    projectId: Joi.number().integer().required(),
    userId: Joi.string().uuid().required(),
    jobId: Joi.string().uuid(),
    startDate: Joi.date(),
    endDate: Joi.date(),
    memberRate: Joi.number(),
    customerRate: Joi.number(),
    rateType: Joi.rateType().required(),
    status: Joi.jobStatus().required()
  }).required()
}).required()

/**
 * Delete resourceBooking by id
 * @params {Object} currentUser the user who perform this operation
 * @params {String} id the resourceBooking id
 */
async function deleteResourceBooking (currentUser, id) {
  // check permission
  if (!currentUser.hasManagePermission && !currentUser.isMachine) {
    throw new errors.ForbiddenError('You are not allowed to perform this action!')
  }

  const resourceBooking = await ResourceBooking.findById(id)
  await resourceBooking.update({ deletedAt: new Date() })
  await helper.postEvent(config.TAAS_RESOURCE_BOOKING_DELETE_TOPIC, { id })
}

deleteResourceBooking.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  id: Joi.string().guid().required()
}).required()

/**
 * List resourceBookings
 * @param {Object} currentUser the user who perform this operation.
 * @params {Object} criteria the search criteria
 * @params {Object} options the extra options to control the function
 * @returns {Object} the search result, contain total/page/perPage and result array
 */
async function searchResourceBookings (currentUser, criteria, options = { returnAll: false }) {
  // check user permission
  if (!currentUser.hasManagePermission && !currentUser.isMachine && !currentUser.isConnectManager && !options.returnAll) {
    if (!criteria.projectId) { // regular user can only search with filtering by "projectId"
      throw new errors.ForbiddenError('Not allowed without filtering by "projectId"')
    }
    await helper.checkIsMemberOfProject(currentUser.userId, criteria.projectId)
  }

  // `criteria`.projectIds` could be array of ids, or comma separated string of ids
  // in case it's comma separated string of ids we have to convert it to an array of ids
  if ((typeof criteria.projectIds) === 'string') {
    criteria.projectIds = criteria.projectIds.trim().split(',').map(projectIdRaw => {
      const projectIdRawTrimmed = projectIdRaw.trim()
      const projectId = Number(projectIdRawTrimmed)
      if (_.isNaN(projectId)) {
        throw new errors.BadRequestError(`projectId ${projectIdRawTrimmed} is not a valid number`)
      }
      return projectId
    })
  }
  const page = criteria.page > 0 ? criteria.page : 1
  let perPage
  if (options.returnAll) {
    // To simplify the logic we are use a very large number for perPage
    // because in practice there could hardly be so many records to be returned.(also consider we are using filters in the meantime)
    // the number is limited by `index.max_result_window`, its default value is 10000, see
    // https://www.elastic.co/guide/en/elasticsearch/reference/current/index-modules.html#index-max-result-window
    perPage = 10000
  } else {
    perPage = criteria.perPage > 0 ? criteria.perPage : 20
  }

  if (!criteria.sortBy) {
    criteria.sortBy = 'id'
  }
  if (!criteria.sortOrder) {
    criteria.sortOrder = 'desc'
  }
  try {
    const sort = [{ [criteria.sortBy === 'id' ? '_id' : criteria.sortBy]: { order: criteria.sortOrder } }]

    const esQuery = {
      index: config.get('esConfig.ES_INDEX_RESOURCE_BOOKING'),
      body: {
        query: {
          bool: {
            must: []
          }
        },
        from: (page - 1) * perPage,
        size: perPage,
        sort
      }
    }

    _.each(_.pick(criteria, ['status', 'startDate', 'endDate', 'rateType', 'projectId']), (value, key) => {
      esQuery.body.query.bool.must.push({
        term: {
          [key]: {
            value
          }
        }
      })
    })
    // if criteria contains projectIds, filter projectId with this value
    if (criteria.projectIds) {
      esQuery.body.query.bool.filter = [{
        terms: {
          projectId: criteria.projectIds
        }
      }]
    }
    logger.debug({ component: 'ResourceBookingService', context: 'searchResourceBookings', message: `Query: ${JSON.stringify(esQuery)}` })

    const { body } = await esClient.search(esQuery)

    return {
      total: body.hits.total.value,
      page,
      perPage,
      result: _.map(body.hits.hits, (hit) => {
        const obj = _.cloneDeep(hit._source)
        obj.id = hit._id
        return obj
      })
    }
  } catch (err) {
    logger.logFullError(err, { component: 'ResourceBookingService', context: 'searchResourceBookings' })
  }
  logger.info({ component: 'ResourceBookingService', context: 'searchResourceBookings', message: 'fallback to DB query' })
  const filter = {
    [Op.and]: [{ deletedAt: null }]
  }
  _.each(_.pick(criteria, ['status', 'startDate', 'endDate', 'rateType']), (value, key) => {
    filter[Op.and].push({ [key]: value })
  })
  if (criteria.projectIds) {
    filter[Op.and].push({ projectId: criteria.projectIds })
  }
  const resourceBookings = await ResourceBooking.findAll({
    where: filter,
    attributes: {
      exclude: ['deletedAt']
    },
    offset: ((page - 1) * perPage),
    limit: perPage,
    order: [[criteria.sortBy, criteria.sortOrder]]
  })
  return {
    fromDb: true,
    total: resourceBookings.length,
    page,
    perPage,
    result: _.map(resourceBookings, resourceBooking => helper.clearObject(resourceBooking.dataValues))
  }
}

searchResourceBookings.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  criteria: Joi.object().keys({
    page: Joi.number().integer(),
    perPage: Joi.number().integer(),
    sortBy: Joi.string().valid('id', 'rateType', 'startDate', 'endDate', 'customerRate', 'memberRate', 'status'),
    sortOrder: Joi.string().valid('desc', 'asc'),
    status: Joi.jobStatus(),
    startDate: Joi.date(),
    endDate: Joi.date(),
    rateType: Joi.rateType(),
    projectId: Joi.number().integer(),
    projectIds: Joi.alternatives(
      Joi.string(),
      Joi.array().items(Joi.number().integer())
    )
  }).required(),
  options: Joi.object()
}).required()

module.exports = {
  getResourceBooking,
  createResourceBooking,
  partiallyUpdateResourceBooking,
  fullyUpdateResourceBooking,
  deleteResourceBooking,
  searchResourceBookings
}
