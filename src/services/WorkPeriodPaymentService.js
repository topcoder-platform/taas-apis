/**
 * This service provides operations of WorkPeriod.
 */

const _ = require('lodash')
const Joi = require('joi')
const config = require('config')
const HttpStatus = require('http-status-codes')
const { Op } = require('sequelize')
const uuid = require('uuid')
const moment = require('moment')
const helper = require('../common/helper')
const logger = require('../common/logger')
const errors = require('../common/errors')
const models = require('../models')
const { createPayment } = require('./PaymentService')

const WorkPeriodPayment = models.WorkPeriodPayment
const esClient = helper.getESClient()

/**
 * Check user permission for creating, updating or getting
 * work period payment.
 * Only Booking Manager, Admin, and M2M has access to create, view or update payments
 * @param {Object} currentUser the user who perform this operation.
 * @returns {undefined}
 */
async function _checkUserPermissionForCRUWorkPeriodPayment (currentUser) {
  if (!currentUser.hasManagePermission && !currentUser.isMachine) {
    throw new errors.ForbiddenError('You are not allowed to perform this action!')
  }
}

/**
 * Get workPeriodPayment by id
 * @param {Object} currentUser the user who perform this operation.
 * @param {String} id the workPeriodPayment id
 * @param {Boolean} fromDb flag if query db for data or not
 * @returns {Object} the workPeriodPayment
 */
async function getWorkPeriodPayment (currentUser, id, fromDb = false) {
  // check user permission
  await _checkUserPermissionForCRUWorkPeriodPayment(currentUser)
  if (!fromDb) {
    try {
      const workPeriod = await esClient.search({
        index: config.esConfig.ES_INDEX_WORK_PERIOD,
        _source: 'payments',
        body: {
          query: {
            nested: {
              path: 'payments',
              query: {
                match: { 'payments.id': id }
              }
            }
          }
        }
      })

      if (!workPeriod.body.hits.total.value) {
        throw new errors.NotFoundError()
      }
      const workPeriodPaymentRecord = _.find(workPeriod.body.hits.hits[0]._source.payments, { id })
      return workPeriodPaymentRecord
    } catch (err) {
      if (err.httpStatus === HttpStatus.NOT_FOUND) {
        throw new errors.NotFoundError(`id: ${id} "WorkPeriodPayment" not found`)
      }
      if (err.httpStatus === HttpStatus.FORBIDDEN) {
        throw err
      }
      logger.logFullError(err, { component: 'WorkPeriodPaymentService', context: 'getWorkPeriodPayment' })
    }
  }
  logger.info({ component: 'WorkPeriodPaymentService', context: 'getWorkPeriodPayment', message: 'try to query db for data' })
  const workPeriodPayment = await WorkPeriodPayment.findById(id)

  return workPeriodPayment
}

getWorkPeriodPayment.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  id: Joi.string().guid().required(),
  fromDb: Joi.boolean()
}).required()

/**
 * Create workPeriodPayment
 * @param {Object} currentUser the user who perform this operation
 * @param {Object} workPeriodPayment the workPeriodPayment to be created
 * @returns {Object} the created workPeriodPayment
 */
async function createWorkPeriodPayment (currentUser, workPeriodPayment) {
  // check permission
  await _checkUserPermissionForCRUWorkPeriodPayment(currentUser)

  const { projectId, userHandle, endDate } = await helper.ensureWorkPeriodById(workPeriodPayment.workPeriodId) // ensure work period exists
  const paymentChallenge = await createPayment({
    projectId,
    userHandle,
    amount: workPeriodPayment.amount,
    name: `TaaS Payment - ${userHandle} - Week Ending ${moment(endDate).format('DD/MM/YYYY')}}`,
    description: `TaaS Payment - ${userHandle} - Week Ending ${moment(endDate).format('DD/MM/YYYY')}}`
  })
  workPeriodPayment.id = uuid.v4()
  workPeriodPayment.challengeId = paymentChallenge.id
  workPeriodPayment.createdBy = await helper.getUserId(currentUser.userId)

  let created = null
  try {
    created = await WorkPeriodPayment.create(workPeriodPayment)
  } catch (err) {
    if (!_.isUndefined(err.original)) {
      throw new errors.BadRequestError(err.original.detail)
    } else {
      throw err
    }
  }

  await helper.postEvent(config.TAAS_WORK_PERIOD_PAYMENT_CREATE_TOPIC, created.toJSON())
  return created.dataValues
}

createWorkPeriodPayment.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  workPeriodPayment: Joi.object().keys({
    workPeriodId: Joi.string().uuid().required(),
    amount: Joi.number().greater(0).allow(null),
    status: Joi.workPeriodPaymentStatus().default('completed')
  }).required()
}).required()

/**
 * Update workPeriodPayment
 * @param {Object} currentUser the user who perform this operation
 * @param {String} id the workPeriod id
 * @param {Object} data the data to be updated
 * @returns {Object} the updated workPeriodPayment
 */
async function updateWorkPeriodPayment (currentUser, id, data) {
  // check permission
  await _checkUserPermissionForCRUWorkPeriodPayment(currentUser)

  if (data.workPeriodId) {
    // ensure work period exists
    await helper.ensureWorkPeriodById(data.workPeriodId)
  }
  const workPeriodPayment = await WorkPeriodPayment.findById(id)
  const oldValue = workPeriodPayment.toJSON()

  data.updatedBy = await helper.getUserId(currentUser.userId)
  let updated = null
  try {
    updated = await workPeriodPayment.update(data)
  } catch (err) {
    if (!_.isUndefined(err.original)) {
      throw new errors.BadRequestError(err.original.detail)
    } else {
      throw err
    }
  }

  await helper.postEvent(config.TAAS_WORK_PERIOD_PAYMENT_UPDATE_TOPIC, updated.toJSON(), { oldValue: oldValue })
  return updated.dataValues
}

/**
 * Partially update workPeriodPayment by id
 * @param {Object} currentUser the user who perform this operation
 * @param {String} id the workPeriodPayment id
 * @param {Object} data the data to be updated
 * @returns {Object} the updated workPeriodPayment
 */
async function partiallyUpdateWorkPeriodPayment (currentUser, id, data) {
  return updateWorkPeriodPayment(currentUser, id, data)
}

partiallyUpdateWorkPeriodPayment.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  id: Joi.string().uuid().required(),
  data: Joi.object().keys({
    workPeriodId: Joi.string().uuid(),
    amount: Joi.number().greater(0).allow(null),
    status: Joi.workPeriodPaymentStatus()
  }).required()
}).required()

/**
 * Fully update workPeriodPayment by id
 * @param {Object} currentUser the user who perform this operation
 * @param {String} id the workPeriodPayment id
 * @param {Object} data the data to be updated
 * @returns {Object} the updated workPeriodPayment
 */
async function fullyUpdateWorkPeriodPayment (currentUser, id, data) {
  return updateWorkPeriodPayment(currentUser, id, data)
}

fullyUpdateWorkPeriodPayment.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  id: Joi.string().uuid().required(),
  data: Joi.object().keys({
    workPeriodId: Joi.string().uuid().required(),
    amount: Joi.number().greater(0).allow(null),
    status: Joi.workPeriodPaymentStatus()
  }).required()
}).required()

/**
 * List workPeriodPayments
 * @param {Object} currentUser the user who perform this operation.
 * @param {Object} criteria the search criteria
 * @param {Object} options the extra options to control the function
 * @returns {Object} the search result, contain total/page/perPage and result array
 */
async function searchWorkPeriodPayments (currentUser, criteria, options = { returnAll: false }) {
  // check user permission
  await _checkUserPermissionForCRUWorkPeriodPayment(currentUser)

  if ((typeof criteria.workPeriodIds) === 'string') {
    criteria.workPeriodIds = criteria.workPeriodIds.trim().split(',').map(workPeriodIdRaw => {
      const workPeriodId = workPeriodIdRaw.trim()
      if (!uuid.validate(workPeriodId)) {
        throw new errors.BadRequestError(`workPeriodId ${workPeriodId} is not a valid uuid`)
      }
      return workPeriodId
    })
  }
  const page = criteria.page
  const perPage = criteria.perPage
  try {
    const esQuery = {
      index: config.get('esConfig.ES_INDEX_WORK_PERIOD'),
      _source: 'payments',
      body: {
        query: {
          nested: {
            path: 'payments',
            query: { bool: { must: [] } }
          }
        },
        size: 10000
        // We use a very large number for size, because we can't paginate nested documents
        // and in practice there could hardly be so many records to be returned.(also consider we are using filters in the meantime)
        // the number is limited by `index.max_result_window`, its default value is 10000, see
        // https://www.elastic.co/guide/en/elasticsearch/reference/current/index-modules.html#index-max-result-window
      }
    }
    _.each(_.pick(criteria, ['status', 'workPeriodId']), (value, key) => {
      esQuery.body.query.nested.query.bool.must.push({
        term: {
          [`payments.${key}`]: {
            value
          }
        }
      })
    })
    if (criteria.workPeriodIds) {
      esQuery.body.query.nested.query.bool.filter = [{
        terms: {
          'payments.workPeriodId': criteria.workPeriodIds
        }
      }]
    }
    logger.debug({ component: 'WorkPeriodPaymentService', context: 'searchWorkPeriodPayment', message: `Query: ${JSON.stringify(esQuery)}` })

    const { body } = await esClient.search(esQuery)
    let payments = _.reduce(body.hits.hits, (acc, workPeriod) => _.concat(acc, workPeriod._source.payments), [])
    if (criteria.status) {
      payments = _.filter(payments, { status: criteria.status })
    }
    payments = _.sortBy(payments, [criteria.sortBy])
    if (criteria.sortOrder === 'desc') {
      payments = _.reverse(payments)
    }
    const total = payments.length
    if (!options.returnAll) {
      payments = _.slice(payments, (page - 1) * perPage, page * perPage)
    }

    return {
      total,
      page,
      perPage,
      result: payments
    }
  } catch (err) {
    logger.logFullError(err, { component: 'WorkPeriodPaymentService', context: 'searchWorkPeriodPaymentService' })
  }
  logger.info({ component: 'WorkPeriodPaymentService', context: 'searchWorkPeriodPayments', message: 'fallback to DB query' })
  const filter = { [Op.and]: [] }
  _.each(_.pick(criteria, ['status', 'workPeriodId']), (value, key) => {
    filter[Op.and].push({ [key]: value })
  })
  if (criteria.workPeriodIds) {
    filter[Op.and].push({ workPeriodId: criteria.workPeriodIds })
  }
  const workPeriodPayments = await WorkPeriodPayment.findAll({
    where: filter,
    offset: ((page - 1) * perPage),
    limit: perPage,
    order: [[criteria.sortBy, criteria.sortOrder]]
  })
  return {
    fromDb: true,
    total: workPeriodPayments.length,
    page,
    perPage,
    result: _.map(workPeriodPayments, workPeriodPayment => {
      return workPeriodPayment.dataValues
    })
  }
}

searchWorkPeriodPayments.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  criteria: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1),
    perPage: Joi.number().integer().min(1).max(10000).default(20),
    sortBy: Joi.string().valid('status', 'amount', 'createdAt', 'updatedAt').default('createdAt'),
    sortOrder: Joi.string().valid('desc', 'asc').default('desc'),
    status: Joi.workPeriodPaymentStatus(),
    workPeriodId: Joi.string().uuid(),
    workPeriodIds: Joi.alternatives(
      Joi.string(),
      Joi.array().items(Joi.string().uuid())
    )
  }).required(),
  options: Joi.object()
}).required()

module.exports = {
  getWorkPeriodPayment,
  createWorkPeriodPayment,
  partiallyUpdateWorkPeriodPayment,
  fullyUpdateWorkPeriodPayment,
  searchWorkPeriodPayments
}
