/**
 * This service provides operations of WorkPeriod.
 */

const _ = require('lodash')
const Joi = require('joi').extend(require('@joi/date'))
const config = require('config')
const HttpStatus = require('http-status-codes')
const { Op } = require('sequelize')
const uuid = require('uuid')
const helper = require('../common/helper')
const logger = require('../common/logger')
const errors = require('../common/errors')
const models = require('../models')
const { PaymentStatus, WorkPeriodPaymentStatus } = require('../../app-constants')
const { searchResourceBookings } = require('./ResourceBookingService')

const WorkPeriodPayment = models.WorkPeriodPayment
const WorkPeriod = models.WorkPeriod
const esClient = helper.getESClient()

/**
 * Check user permission for creating, updating or getting
 * work period payment.
 * Only Booking Manager, Admin, and M2M has access to create, view or update payments
 * @param {Object} currentUser the user who perform this operation.
 * @returns {undefined}
 */
function _checkUserPermissionForCRUWorkPeriodPayment (currentUser) {
  if (!currentUser.hasManagePermission && !currentUser.isMachine) {
    throw new errors.ForbiddenError('You are not allowed to perform this action!')
  }
}

/**
 * Create single workPeriodPayment
 * @param {Object} workPeriodPayment the workPeriodPayment to be created
 * @param {String} createdBy the authUser id
 * @returns {Object} the created workPeriodPayment
 */
async function _createSingleWorkPeriodPayment (workPeriodPayment, createdBy) {
  const correspondingWorkPeriod = await helper.ensureWorkPeriodById(workPeriodPayment.workPeriodId) // ensure work period exists

  // get billingAccountId from corresponding resource booking
  const correspondingResourceBooking = await helper.ensureResourceBookingById(correspondingWorkPeriod.resourceBookingId)

  return _createSingleWorkPeriodPaymentWithWorkPeriodAndResourceBooking(workPeriodPayment, createdBy, correspondingWorkPeriod.toJSON(), correspondingResourceBooking.toJSON())
}

/**
 * Create single workPeriodPayment
 * @param {Object} workPeriodPayment the workPeriodPayment to be created
 * @param {String} createdBy the authUser id
 * @param {Object} correspondingWorkPeriod the workPeriod
 * @param {Object} correspondingResourceBooking the resourceBooking
 * @returns {Object} the created workPeriodPayment
 */
async function _createSingleWorkPeriodPaymentWithWorkPeriodAndResourceBooking (workPeriodPayment, createdBy, correspondingWorkPeriod, correspondingResourceBooking) {
  if (_.isNil(correspondingResourceBooking.billingAccountId)) {
    throw new errors.ConflictError(`id: ${correspondingResourceBooking.id} "ResourceBooking" Billing account is not assigned to the resource booking`)
  }
  workPeriodPayment.billingAccountId = correspondingResourceBooking.billingAccountId
  if (_.isNil(correspondingResourceBooking.memberRate)) {
    throw new errors.ConflictError(`Can't find a member rate in ResourceBooking: ${correspondingResourceBooking.id} to calculate the amount`)
  }
  if (correspondingResourceBooking.memberRate <= 0) {
    throw new errors.ConflictError(`Can't process payment with member rate: ${correspondingResourceBooking.memberRate}. It must be higher than 0`)
  }
  workPeriodPayment.memberRate = correspondingResourceBooking.memberRate
  const maxPossibleDays = correspondingWorkPeriod.daysWorked - correspondingWorkPeriod.daysPaid
  if (workPeriodPayment.days > maxPossibleDays) {
    throw new errors.BadRequestError(`Days cannot be more than not paid days which is ${maxPossibleDays}`)
  }
  if (maxPossibleDays <= 0) {
    throw new errors.ConflictError(`There are no days to pay for WorkPeriod: ${correspondingWorkPeriod.id}`)
  }
  workPeriodPayment.days = _.defaultTo(workPeriodPayment.days, maxPossibleDays)
  workPeriodPayment.amount = _.round(workPeriodPayment.memberRate * workPeriodPayment.days / 5, 2)
  workPeriodPayment.customerRate = _.defaultTo(correspondingResourceBooking.customerRate, null)
  workPeriodPayment.id = uuid.v4()
  workPeriodPayment.status = WorkPeriodPaymentStatus.SCHEDULED
  workPeriodPayment.createdBy = createdBy

  const created = await WorkPeriodPayment.create(workPeriodPayment)
  await helper.postEvent(config.TAAS_WORK_PERIOD_PAYMENT_CREATE_TOPIC, created.toJSON(), { key: `workPeriodPayment.billingAccountId:${workPeriodPayment.billingAccountId}` })
  return created.dataValues
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
  _checkUserPermissionForCRUWorkPeriodPayment(currentUser)
  if (!fromDb) {
    try {
      const resourceBooking = await esClient.search({
        index: config.esConfig.ES_INDEX_RESOURCE_BOOKING,
        _source: 'workPeriods.payments',
        body: {
          query: {
            nested: {
              path: 'workPeriods.payments',
              query: {
                match: { 'workPeriods.payments.id': id }
              }
            }
          }
        }
      })

      if (!resourceBooking.body.hits.total.value) {
        throw new errors.NotFoundError()
      }
      let workPeriodPaymentRecord = null
      _.forEach(resourceBooking.body.hits.hits[0]._source.workPeriods, wp => {
        _.forEach(wp.payments, p => {
          if (p.id === id) {
            workPeriodPaymentRecord = p
            return false
          }
        })
        if (workPeriodPaymentRecord) {
          return false
        }
      })
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
  _checkUserPermissionForCRUWorkPeriodPayment(currentUser)
  const createdBy = await helper.getUserId(currentUser.userId)

  if (_.isArray(workPeriodPayment)) {
    const result = []
    for (const wp of workPeriodPayment) {
      try {
        const successResult = await _createSingleWorkPeriodPayment(wp, createdBy)
        result.push(successResult)
      } catch (e) {
        result.push(_.extend(_.pick(wp, 'workPeriodId'), { error: { message: e.message, code: e.httpStatus } }))
      }
    }
    return result
  } else {
    return await _createSingleWorkPeriodPayment(workPeriodPayment, createdBy)
  }
}

const singleCreateWorkPeriodPaymentSchema = Joi.object().keys({
  workPeriodId: Joi.string().uuid().required(),
  days: Joi.number().integer().min(1).max(5)
})
createWorkPeriodPayment.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  workPeriodPayment: Joi.alternatives().try(
    singleCreateWorkPeriodPaymentSchema.required(),
    Joi.array().min(1).items(singleCreateWorkPeriodPaymentSchema).required()
  ).required()
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
  _checkUserPermissionForCRUWorkPeriodPayment(currentUser)

  const workPeriodPayment = await WorkPeriodPayment.findById(id)
  const oldValue = workPeriodPayment.toJSON()
  if (data.status === 'cancelled' && oldValue.status === 'in-progress') {
    throw new errors.BadRequestError('You cannot cancel a WorkPeriodPayment which is in-progress')
  }
  if (data.status === 'scheduled') {
    if (oldValue.status !== 'failed') {
      throw new errors.BadRequestError(`You cannot schedule a WorkPeriodPayment which is ${oldValue.status}`)
    }
    const workPeriod = WorkPeriod.findById(workPeriodPayment.workPeriodId)
    // we con't check if paymentStatus is 'completed'
    // because paymentStatus can be in-progress when daysWorked = daysPaid
    if (workPeriod.daysWorked === workPeriod.daysPaid) {
      throw new errors.BadRequestError('There is no available daysWorked to schedule a payment')
    }
  }
  data.updatedBy = await helper.getUserId(currentUser.userId)
  const updated = await workPeriodPayment.update(data)
  await helper.postEvent(config.TAAS_WORK_PERIOD_PAYMENT_UPDATE_TOPIC, updated.toJSON(), { oldValue: oldValue, key: `workPeriodPayment.billingAccountId:${updated.billingAccountId}` })
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
    status: Joi.workPeriodPaymentUpdateStatus()
  }).min(1).required()
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
  _checkUserPermissionForCRUWorkPeriodPayment(currentUser)

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
      index: config.get('esConfig.ES_INDEX_RESOURCE_BOOKING'),
      _source: 'workPeriods.payments',
      body: {
        query: {
          nested: {
            path: 'workPeriods.payments',
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
          [`workPeriods.payments.${key}`]: {
            value
          }
        }
      })
    })
    if (criteria.workPeriodIds) {
      esQuery.body.query.nested.query.bool.filter = [{
        terms: {
          'workPeriods.payments.workPeriodId': criteria.workPeriodIds
        }
      }]
    }
    logger.debug({ component: 'WorkPeriodPaymentService', context: 'searchWorkPeriodPayment', message: `Query: ${JSON.stringify(esQuery)}` })

    const { body } = await esClient.search(esQuery)
    const workPeriods = _.reduce(body.hits.hits, (acc, resourceBooking) => _.concat(acc, resourceBooking._source.workPeriods), [])
    let payments = _.reduce(workPeriods, (acc, workPeriod) => _.concat(acc, workPeriod.payments), [])
    if (criteria.workPeriodId) {
      payments = _.filter(payments, { workPeriodId: criteria.workPeriodId })
    } else if (criteria.workPeriodIds) {
      payments = _.filter(payments, p => _.includes(criteria.workPeriodIds, p.workPeriodId))
    }
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
  const total = await WorkPeriodPayment.count({ where: filter })
  return {
    fromDb: true,
    total,
    page,
    perPage,
    result: workPeriodPayments
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

/**
 * Create all query workPeriodPayments
 * @param {Object} currentUser the user who perform this operation.
 * @param {Object} criteria the query criteria
 * @returns {Object} the process result
 */
async function createQueryWorkPeriodPayments (currentUser, criteria) {
  // check permission
  _checkUserPermissionForCRUWorkPeriodPayment(currentUser)
  const createdBy = await helper.getUserId(currentUser.userId)
  const query = criteria.query
  if ((typeof query['workPeriods.paymentStatus']) === 'string') {
    query['workPeriods.paymentStatus'] = query['workPeriods.paymentStatus'].trim().split(',').map(ps => Joi.attempt({ paymentStatus: ps.trim() }, Joi.object().keys({ paymentStatus: Joi.string().valid(PaymentStatus.PENDING, PaymentStatus.PARTIALLY_COMPLETED, PaymentStatus.FAILED) })).paymentStatus)
  }
  const fields = _.join(_.uniq(_.concat(
    ['id', 'billingAccountId', 'memberRate', 'customerRate', 'workPeriods.id', 'workPeriods.resourceBookingId', 'workPeriods.daysWorked', 'workPeriods.daysPaid'],
    _.map(_.keys(query), k => k === 'projectIds' ? 'projectId' : k))
  ), ',')
  const searchResult = await searchResourceBookings(currentUser, _.extend({ fields, page: 1 }, query), { returnAll: true })

  const wpArray = _.flatMap(searchResult.result, 'workPeriods')
  const resourceBookingMap = _.fromPairs(_.map(searchResult.result, rb => [rb.id, rb]))
  const result = { total: wpArray.length, query, totalSuccess: 0, totalError: 0 }

  for (const wp of wpArray) {
    try {
      await _createSingleWorkPeriodPaymentWithWorkPeriodAndResourceBooking({ workPeriodId: wp.id }, createdBy, wp, resourceBookingMap[wp.resourceBookingId])
      result.totalSuccess++
    } catch (err) {
      logger.logFullError(err, { component: 'WorkPeriodPaymentService', context: 'createQueryWorkPeriodPayments' })
      result.totalError++
    }
  }
  return result
}

createQueryWorkPeriodPayments.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  criteria: Joi.object().keys({
    query: Joi.object().keys({
      status: Joi.resourceBookingStatus(),
      startDate: Joi.date().format('YYYY-MM-DD'),
      endDate: Joi.date().format('YYYY-MM-DD'),
      rateType: Joi.rateType(),
      jobId: Joi.string().uuid(),
      userId: Joi.string().uuid(),
      projectId: Joi.number().integer(),
      projectIds: Joi.alternatives(
        Joi.string(),
        Joi.array().items(Joi.number().integer())
      ),
      'workPeriods.paymentStatus': Joi.alternatives(
        Joi.string(),
        Joi.array().items(Joi.string().valid(PaymentStatus.PENDING, PaymentStatus.PARTIALLY_COMPLETED, PaymentStatus.FAILED))
      ),
      'workPeriods.startDate': Joi.date().format('YYYY-MM-DD'),
      'workPeriods.endDate': Joi.date().format('YYYY-MM-DD'),
      'workPeriods.userHandle': Joi.string()
    }).required()
  }).required()
}).required()

module.exports = {
  getWorkPeriodPayment,
  createWorkPeriodPayment,
  createQueryWorkPeriodPayments,
  partiallyUpdateWorkPeriodPayment,
  searchWorkPeriodPayments
}
