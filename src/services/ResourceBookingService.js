/**
 * This service provides operations of ResourceBooking.
 */

const _ = require('lodash')
const Joi = require('joi')
const config = require('config')
const { v4: uuid } = require('uuid')
const helper = require('../common/helper')
const logger = require('../common/logger')
const errors = require('../common/errors')
const models = require('../models')

const ResourceBooking = models.ResourceBooking

/**
 * Get resourceBooking by id
 * @param {Object} currentUser the user who perform this operation.
 * @param {String} id the resourceBooking id
 * @returns {Object} the resourceBooking
 */
async function getResourceBooking (currentUser, id) {
  const resourceBooking = await ResourceBooking.findById(id)
  if (currentUser.isBookingManager) {
    return helper.clearObject(resourceBooking.dataValues)
  } else if (await helper.isConnectMember(resourceBooking.dataValues.projectId, currentUser.jwtToken)) {
    return _.omit(helper.clearObject(resourceBooking.dataValues), 'memberRate')
  } else {
    return _.omit(helper.clearObject(resourceBooking.dataValues), 'customerRate')
  }
}

getResourceBooking.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  id: Joi.string().guid().required()
}).required()

/**
 * Create resourceBooking
 * @params {Object} currentUser the user who perform this operation
 * @params {Object} resourceBooking the resourceBooking to be created
 * @returns {Object} the created resourceBooking
 */
async function createResourceBooking (currentUser, resourceBooking) {
  if (!currentUser.isBookingManager) {
    const connect = await helper.isConnectMember(resourceBooking.projectId, currentUser.jwtToken)
    if (!connect) {
      throw new errors.ForbiddenError('You are not allowed to perform this action!')
    }
  }
  resourceBooking.id = uuid()
  resourceBooking.createdAt = new Date()
  resourceBooking.createdBy = await helper.getUserId(currentUser.userId)
  resourceBooking.status = 'sourcing'

  const esClient = helper.getESClient()
  await esClient.create({
    index: config.get('esConfig.ES_INDEX_RESOURCE_BOOKING'),
    id: resourceBooking.id,
    body: _.omit(resourceBooking, 'id'),
    refresh: 'true' // refresh ES so that it is visible for read operations instantly
  })

  const created = await ResourceBooking.create(resourceBooking)
  return helper.clearObject(created.dataValues)
}

createResourceBooking.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  resourceBooking: Joi.object().keys({
    projectId: Joi.number().integer().required(),
    userId: Joi.string().uuid().required(),
    jobId: Joi.string().uuid(),
    startDate: Joi.date().required(),
    endDate: Joi.date().required(),
    memberRate: Joi.number().required(),
    customerRate: Joi.number().required(),
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
  const resourceBooking = await ResourceBooking.findById(id)
  if (!currentUser.isBookingManager) {
    const connect = await helper.isConnectMember(resourceBooking.dataValues.projectId, currentUser.jwtToken)
    if (!connect) {
      throw new errors.ForbiddenError('You are not allowed to perform this action!')
    }
  }
  data.updatedAt = new Date()
  data.updatedBy = await helper.getUserId(currentUser.userId)

  const esClient = helper.getESClient()
  await esClient.update({
    index: config.get('esConfig.ES_INDEX_RESOURCE_BOOKING'),
    id,
    body: {
      doc: data
    },
    refresh: 'true' // refresh ES so that it is visible for read operations instantly
  })

  await resourceBooking.update(data)
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
  return updateResourceBooking(currentUser, id, data)
}

fullyUpdateResourceBooking.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  id: Joi.string().uuid().required(),
  data: Joi.object().keys({
    projectId: Joi.number().integer().required(),
    userId: Joi.string().uuid().required(),
    jobId: Joi.string().uuid(),
    startDate: Joi.date().required(),
    endDate: Joi.date().required(),
    memberRate: Joi.number().required(),
    customerRate: Joi.number().required(),
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
  if (!currentUser.isBookingManager) {
    throw new errors.ForbiddenError('You are not allowed to perform this action!')
  }

  const esClient = helper.getESClient()
  await esClient.delete({
    index: config.get('esConfig.ES_INDEX_RESOURCE_BOOKING'),
    id,
    refresh: 'true' // refresh ES so that it is visible for read operations instantly
  }, {
    ignore: [404]
  })

  const resourceBooking = await ResourceBooking.findById(id)
  await resourceBooking.update({ deletedAt: new Date() })
}

deleteResourceBooking.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  id: Joi.string().guid().required()
}).required()

/**
 * List resourceBookings
 * @params {Object} criteria the search criteria
 * @returns {Object} the search result, contain total/page/perPage and result array
 */
async function searchResourceBookings (criteria) {
  const page = criteria.page > 0 ? criteria.page : 1
  const perPage = criteria.perPage > 0 ? criteria.perPage : 20

  if (!criteria.sortBy) {
    criteria.sortBy = '_id'
  }
  if (criteria.sortBy === 'id') {
    criteria.sortBy = '_id'
  }

  if (!criteria.sortOrder) {
    criteria.sortOrder = 'desc'
  }
  const sort = [{ [criteria.sortBy]: { order: criteria.sortOrder } }]

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

  _.each(_.pick(criteria, ['status', 'startDate', 'endDate', 'rateType']), (value, key) => {
    esQuery.body.query.bool.must.push({
      term: {
        [key]: {
          value
        }
      }
    })
  })
  logger.debug(`Query: ${JSON.stringify(esQuery)}`)

  const esClient = helper.getESClient()
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
}

searchResourceBookings.schema = Joi.object().keys({
  criteria: Joi.object().keys({
    page: Joi.number().integer(),
    perPage: Joi.number().integer(),
    sortBy: Joi.string().valid('id', 'rateType', 'startDate', 'endDate', 'customerRate', 'memberRate', 'status'),
    sortOrder: Joi.string().valid('desc', 'asc'),
    status: Joi.jobStatus(),
    startDate: Joi.date(),
    endDate: Joi.date(),
    rateType: Joi.rateType()
  }).required()
}).required()

module.exports = {
  getResourceBooking,
  createResourceBooking,
  partiallyUpdateResourceBooking,
  fullyUpdateResourceBooking,
  deleteResourceBooking,
  searchResourceBookings
}
