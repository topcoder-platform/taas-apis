/**
 * This service provides operations of WorkPeriod.
 */

const _ = require('lodash')
const Joi = require('joi').extend(require('@joi/date'))
const config = require('config')
const { Op } = require('sequelize')
const uuid = require('uuid')
const moment = require('moment')
const helper = require('../common/helper')
const logger = require('../common/logger')
const errors = require('../common/errors')
const models = require('../models')
const { WorkPeriodPaymentStatus, ActiveWorkPeriodPaymentStatuses } = require('../../app-constants')
const { searchResourceBookings } = require('./ResourceBookingService')

const sequelize = models.sequelize
const WorkPeriodPayment = models.WorkPeriodPayment
const WorkPeriod = models.WorkPeriod

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
 * update challenge
 * @param {String} challengeId the challenge id
 * @param {Object} data        the challenge update data
 * @returns {undefined}
 */
async function _updateChallenge (challengeId, data) {
  const body = {}

  if (data.billingAccountId) {
    body.billing = {
      billingAccountId: _.toString(data.billingAccountId),
      markup: 0 //  for TaaS payments we always use 0 markup
    }
  }

  if (data.billingAccountId) {
    try {
      await helper.updateChallenge(challengeId, body)
      logger.debug({ component: 'WorkPeriodPaymentService', context: 'updateChallenge', message: `Challenge with id ${challengeId} is updated` })
    } catch (err) {
      logger.error({ component: 'WorkPeriodPaymentService', context: 'updateChallenge', message: _.get(err, 'response.text', err.toString()) })
      throw new errors.BadRequestError(`Cannot update the the challenge: ${_.get(err, 'response.text', err.toString())}`)
    }
  }
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
  // TODO: we should allow `memberRate` to be `null` as it's not required for additional payments
  workPeriodPayment.memberRate = _.defaultTo(correspondingResourceBooking.memberRate, 0)
  workPeriodPayment.customerRate = _.defaultTo(correspondingResourceBooking.customerRate, null)

  if (!_.has(workPeriodPayment, 'days') || workPeriodPayment.days > 0) {
    if (_.isNil(correspondingResourceBooking.memberRate)) {
      throw new errors.ConflictError(`Can't find a member rate in ResourceBooking: ${correspondingResourceBooking.id} to calculate the amount`)
    }
    if (correspondingResourceBooking.memberRate <= 0) {
      throw new errors.ConflictError(`Can't process payment with member rate: ${correspondingResourceBooking.memberRate}. It must be higher than 0`)
    }

    const maxPossibleDays = correspondingWorkPeriod.daysWorked - correspondingWorkPeriod.daysPaid
    if (workPeriodPayment.days > maxPossibleDays) {
      throw new errors.BadRequestError(`Days cannot be more than not paid days which is ${maxPossibleDays}`)
    }
    if (maxPossibleDays <= 0) {
      throw new errors.ConflictError(`There are no days to pay for WorkPeriod: ${correspondingWorkPeriod.id}`)
    }
    const workPeriodStartTime = moment(`${correspondingWorkPeriod.startDate}T00:00:00.000+12`)
    if (workPeriodStartTime.isAfter(moment())) {
      throw new errors.BadRequestError(`Cannot process payments for the future WorkPeriods. You can process after ${workPeriodStartTime.diff(moment(), 'hours')} hours`)
    }
    workPeriodPayment.days = _.defaultTo(workPeriodPayment.days, maxPossibleDays)
    workPeriodPayment.amount = _.round(workPeriodPayment.memberRate * workPeriodPayment.days / 5, 2)
  }

  workPeriodPayment.id = uuid.v4()
  workPeriodPayment.status = WorkPeriodPaymentStatus.SCHEDULED
  workPeriodPayment.createdBy = createdBy

  const key = `workPeriodPayment.billingAccountId:${workPeriodPayment.billingAccountId}`

  let entity
  try {
    await sequelize.transaction(async (t) => {
      const created = await WorkPeriodPayment.create(workPeriodPayment, { transaction: t })
      entity = created.toJSON()
    })
  } catch (err) {
    if (entity) {
      helper.postErrorEvent(config.TAAS_ERROR_TOPIC, entity, 'workperiodpayment.create')
    }
    throw err
  }
  await helper.postEvent(config.TAAS_WORK_PERIOD_PAYMENT_CREATE_TOPIC, entity, { key })
  return entity
}

/**
 * Get workPeriodPayment by id
 * @param {Object} currentUser the user who perform this operation.
 * @param {String} id the workPeriodPayment id
 * @returns {Object} the workPeriodPayment
 */
async function getWorkPeriodPayment (currentUser, id) {
  // check user permission
  _checkUserPermissionForCRUWorkPeriodPayment(currentUser)

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

  return await _createSingleWorkPeriodPayment(workPeriodPayment, createdBy)
}

const singleCreateWorkPeriodPaymentSchema = Joi.object().keys({
  workPeriodId: Joi.string().uuid().required(),
  days: Joi.number().integer().min(0).max(10),
  amount: Joi.when('days', {
    is: Joi.number().integer().valid(0).exist(),
    then: Joi.number().greater(0).required().messages({
      'any.required': '"amount" has to be provided when processing additional payment for 0 days'
    }),
    otherwise: Joi.forbidden()
  })
}).required()

createWorkPeriodPayment.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  workPeriodPayment: singleCreateWorkPeriodPaymentSchema
})

/**
 * Create workPeriodPayments in bulk
 * @param {Object} currentUser the user who perform this operation
 * @param {Array<Object>} workPeriodPayments the workPeriodPayment to be created
 * @returns {Array<Object>} the created workPeriodPayments
 */
async function createBulkOfWorkPeriodPayments (currentUser, workPeriodPayments) {
  // check permission
  _checkUserPermissionForCRUWorkPeriodPayment(currentUser)
  const createdBy = await helper.getUserId(currentUser.userId)

  const result = []
  for (const wp of workPeriodPayments) {
    try {
      const successResult = await _createSingleWorkPeriodPayment(wp, createdBy)
      result.push(successResult)
    } catch (e) {
      result.push(_.extend(_.pick(wp, 'workPeriodId'), { error: { message: e.message, code: e.httpStatus } }))
    }
  }
  return result
}

createBulkOfWorkPeriodPayments.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  workPeriodPayments: Joi.array().min(1).items(singleCreateWorkPeriodPaymentSchema).required()
}).required()

/**
 * Update workPeriodPayment
 * @param {String} id the workPeriod id
 * @param {Object} data the data to be updated
 * @returns {Object} the updated workPeriodPayment
 */
async function updateWorkPeriodPayment (id, data) {
  const workPeriodPayment = await WorkPeriodPayment.findById(id)

  const oldValue = workPeriodPayment.toJSON()

  if (oldValue.status === 'in-progress') {
    const keys = _.keys(_.pick(data, ['amount', 'days', 'memberRate', 'customerRate', 'billingAccountId']))
    if (keys.length) {
      throw new errors.BadRequestError(`${JSON.stringify(keys)} cannot be updated when workPeriodPayment status is in-progress`)
    }
  }

  if (data.status === 'cancelled' && oldValue.status === 'in-progress') {
    throw new errors.BadRequestError('You cannot cancel a WorkPeriodPayment which is in-progress')
  }
  if (data.status === 'scheduled') {
    if (oldValue.status !== 'failed') {
      throw new errors.BadRequestError(`You cannot schedule a WorkPeriodPayment which is ${oldValue.status}`)
    }
    const workPeriod = await WorkPeriod.findById(workPeriodPayment.workPeriodId)
    // we con't check if paymentStatus is 'completed'
    // because paymentStatus can be in-progress when daysWorked = daysPaid
    if (workPeriod.daysWorked === workPeriod.daysPaid) {
      throw new errors.BadRequestError('There is no available daysWorked to schedule a payment')
    }
  }

  if (data.days) {
    const correspondingWorkPeriod = await helper.ensureWorkPeriodById(workPeriodPayment.workPeriodId) // ensure work period exists
    const maxPossibleDays = correspondingWorkPeriod.daysWorked - (correspondingWorkPeriod.daysPaid -
      (_.includes(ActiveWorkPeriodPaymentStatuses, oldValue.status) ? oldValue.days : 0))
    if (data.days > maxPossibleDays) {
      throw new errors.BadRequestError(`Cannot update days paid to more than ${maxPossibleDays}, otherwise total paid days (${correspondingWorkPeriod.daysPaid -
        (_.includes(ActiveWorkPeriodPaymentStatuses, oldValue.status) ? oldValue.days : 0)}) would be more that total worked days (${correspondingWorkPeriod.daysWorked}) for the week.`)
    }
  }

  // challengeId exist and skip dummy challenge
  if (oldValue.challengeId && oldValue.challengeId !== '00000000-0000-0000-0000-000000000000') {
    await _updateChallenge(workPeriodPayment.challengeId, data)
  }

  const key = `workPeriodPayment.billingAccountId:${workPeriodPayment.billingAccountId}`
  let entity
  try {
    await sequelize.transaction(async (t) => {
      const updated = await workPeriodPayment.update(data, { transaction: t })
      entity = updated.toJSON()
    })
  } catch (e) {
    if (entity) {
      helper.postErrorEvent(config.TAAS_ERROR_TOPIC, entity, 'workperiodpayment.update')
    }
    throw e
  }
  await helper.postEvent(config.TAAS_WORK_PERIOD_PAYMENT_UPDATE_TOPIC, entity, { oldValue: oldValue, key })
  return entity
}

/**
 * Partially update workPeriodPayment by id
 * @param {Object} currentUser the user who perform this operation
 * @param {String} id the workPeriodPayment id
 * @param {Object} data the data to be updated
 * @returns {Object} the updated workPeriodPayment
 */
async function partiallyUpdateWorkPeriodPayment (currentUser, id, data) {
  // check permission
  _checkUserPermissionForCRUWorkPeriodPayment(currentUser)
  data.updatedBy = await helper.getUserId(currentUser.userId)
  return updateWorkPeriodPayment(id, data)
}

const updateWorkPeriodPaymentSchema = Joi.object().keys({
  status: Joi.workPeriodPaymentUpdateStatus(),
  amount: Joi.number().greater(0),
  days: Joi.number().integer().min(0).max(10),
  memberRate: Joi.number().positive(),
  customerRate: Joi.number().positive().allow(null),
  billingAccountId: Joi.number().positive().integer()
}).min(1).required()

partiallyUpdateWorkPeriodPayment.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  id: Joi.string().uuid().required(),
  data: updateWorkPeriodPaymentSchema
}).required()

/**
 * Partially update workPeriodPayment in bulk
 * @param {Object} currentUser the user who perform this operation
 * @param {Array<Object>} workPeriodPayments the workPeriodPayments data to be updated
 * @returns {Array<Object>} the updated workPeriodPayment
 */
async function updateBulkOfWorkPeriodPayments (currentUser, workPeriodPayments) {
  // check permission
  _checkUserPermissionForCRUWorkPeriodPayment(currentUser)
  const updatedBy = await helper.getUserId(currentUser.userId)
  const result = []
  for (const wpp of workPeriodPayments) {
    try {
      const successResult = await updateWorkPeriodPayment(wpp.id, _.assign(_.omit(wpp, 'id'), { updatedBy }))
      result.push(successResult)
    } catch (e) {
      result.push(_.assign(wpp, { error: { message: e.message, code: e.httpStatus } }))
    }
  }
  return result
}

updateBulkOfWorkPeriodPayments.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  workPeriodPayments: Joi.array().min(1).items(
    updateWorkPeriodPaymentSchema.keys({
      id: Joi.string().uuid().required()
    }).min(2).required()
  ).required()
}).required()

/**
 * List workPeriodPayments
 * @param {Object} currentUser the user who perform this operation.
 * @param {Object} criteria the search criteria
 * @returns {Object} the search result, contain total/page/perPage and result array
 */
async function searchWorkPeriodPayments (currentUser, criteria) {
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
  // Joi validation normalizes the dates back to ISO format
  // so, we need to change the date format back to YYYY-MM-DD
  if (criteria.query.startDate) {
    criteria.query.startDate = moment(criteria.query.startDate).format('YYYY-MM-DD')
  }
  if (criteria.query.endDate) {
    criteria.query.endDate = moment(criteria.query.endDate).format('YYYY-MM-DD')
  }
  if (criteria.query['workPeriods.startDate']) {
    criteria.query['workPeriods.startDate'] = moment(criteria.query['workPeriods.startDate']).format('YYYY-MM-DD')
  }
  if (criteria.query['workPeriods.endDate']) {
    criteria.query['workPeriods.endDate'] = moment(criteria.query['workPeriods.endDate']).format('YYYY-MM-DD')
  }
  // save query to return back
  const rawQuery = _.cloneDeep(criteria.query)
  const createdBy = await helper.getUserId(currentUser.userId)
  const query = criteria.query
  if ((typeof query['workPeriods.paymentStatus']) === 'string') {
    query['workPeriods.paymentStatus'] = query['workPeriods.paymentStatus'].trim().split(',').map(ps => Joi.attempt({ paymentStatus: ps.trim() }, Joi.object().keys({ paymentStatus: Joi.paymentStatus() })).paymentStatus)
  }
  const fields = _.join(_.uniq(_.concat(
    ['id', 'billingAccountId', 'memberRate', 'customerRate', 'workPeriods.id', 'workPeriods.resourceBookingId', 'workPeriods.daysWorked', 'workPeriods.daysPaid'],
    _.map(_.keys(query), k => k === 'projectIds' ? 'projectId' : k))
  ), ',')
  const searchResult = await searchResourceBookings(currentUser, _.extend({ fields, page: 1 }, query), { returnAll: true, returnFromDB: true })

  const wpArray = _.flatMap(searchResult.result, 'workPeriods')
  const resourceBookingMap = _.fromPairs(_.map(searchResult.result, rb => [rb.id, rb]))
  const result = { total: wpArray.length, query: rawQuery, totalSuccess: 0, totalError: 0 }

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
        Joi.array().items(Joi.string().valid(Joi.paymentStatus()))
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
  createBulkOfWorkPeriodPayments,
  createQueryWorkPeriodPayments,
  partiallyUpdateWorkPeriodPayment,
  updateBulkOfWorkPeriodPayments,
  searchWorkPeriodPayments
}
