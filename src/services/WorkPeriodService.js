/**
 * This service provides operations of WorkPeriod.
 */

const _ = require('lodash')
const Joi = require('joi').extend(require('@joi/date'))
const config = require('config')
const { Op } = require('sequelize')
const uuid = require('uuid')
const helper = require('../common/helper')
const logger = require('../common/logger')
const errors = require('../common/errors')
const models = require('../models')
const constants = require('../../app-constants')

const WorkPeriod = models.WorkPeriod
const sequelize = models.sequelize

// "startDate" and "endDate" should always represent one week:
// "startDate" should be always Monday and "endDate" should be always Sunday of the same week.
// It should not include time or timezone, only date.
Joi.workPeriodStartDate = () => Joi.date().format('YYYY-MM-DD').custom((value, helpers) => {
  const date = new Date(value)
  const weekDay = date.getDay()
  if (weekDay !== 0) {
    return helpers.message('startDate should be always Sunday')
  }
  return value
})
Joi.workPeriodEndDate = () => Joi.date()
  .when('startDate', {
    is: Joi.exist(),
    then: Joi.date().format('YYYY-MM-DD').equal(Joi.ref('startDate', {
      adjust: (value) => {
        const date = new Date(value)
        date.setDate(date.getDate() + 6)
        return date
      }
    })).messages({
      'any.only': 'endDate should be always the next Saturday'
    }),
    otherwise: Joi.date().format('YYYY-MM-DD').custom((value, helpers) => {
      const date = new Date(value)
      const weekDay = date.getDay()
      if (weekDay !== 6) {
        return helpers.message('endDate should be always Saturday')
      }
      return value
    }).required()
  })
Joi.workPeriodEndDateOptional = () => Joi.date()
  .when('startDate', {
    is: Joi.exist(),
    then: Joi.date().format('YYYY-MM-DD').equal(Joi.ref('startDate', {
      adjust: (value) => {
        const date = new Date(value)
        date.setDate(date.getDate() + 6)
        return date
      }
    })).messages({
      'any.only': 'endDate should be always the next Saturday'
    }),
    otherwise: Joi.date().format('YYYY-MM-DD').custom((value, helpers) => {
      const date = new Date(value)
      const weekDay = date.getDay()
      if (weekDay !== 6) {
        return helpers.message('endDate should be always Saturday')
      }
      return value
    })
  })

/**
 * Check user scopes for getting payments
 * @param {Object} currentUser the user who perform this operation.
 * @returns {Boolean} true if user is machine and has read/all payment scopes
 */
function _checkUserScopesForGetPayments (currentUser) {
  const getPaymentsScopes = [constants.Scopes.READ_WORK_PERIOD_PAYMENT, constants.Scopes.ALL_WORK_PERIOD_PAYMENT]
  return currentUser.isMachine && helper.checkIfExists(getPaymentsScopes, currentUser.scopes)
}

/**
  * Get which fields to be excluded from result
  * @param {Object} currentUser the user who perform this operation.
  * @returns {Object} queryOpt
  * @returns {Object} queryOpt.excludeES excluded fields for ES query
  * @returns {Object} queryOpt.excludeDB excluded fields for DB query
  * @returns {Object} queryOpt.withPayments is payments field included?
  */
function _getWorkPeriodFilteringFields (currentUser) {
  const queryOpt = {
    excludeES: [],
    excludeDB: [],
    withPayments: false
  }
  if (!currentUser.hasManagePermission && !currentUser.isMachine) {
    queryOpt.excludeES.push('workPeriods.paymentTotal')
    queryOpt.excludeDB.push('paymentTotal')
  }
  if (currentUser.hasManagePermission || _checkUserScopesForGetPayments(currentUser)) {
    queryOpt.withPayments = true
  } else { queryOpt.excludeES.push('workPeriods.payments') }
  return queryOpt
}

/**
  * Check user permission for getting work period.
  *
  * @param {Object} currentUser the user who perform this operation.
  * @param {String} projectId the project id
  * @returns {undefined}
  */
async function _checkUserPermissionForGetWorkPeriod (currentUser, projectId) {
  if (!currentUser.hasManagePermission && !currentUser.isMachine && !currentUser.isConnectManager) {
    await helper.checkIsMemberOfProject(currentUser.userId, projectId)
  }
}

/**
  * Check user permission for creating or updating work period.
  *
  * @param {Object} currentUser the user who perform this operation.
  * @returns {undefined}
  */
async function _checkUserPermissionForWriteWorkPeriod (currentUser) {
  if (!currentUser.hasManagePermission && !currentUser.isMachine) {
    throw new errors.ForbiddenError('You are not allowed to perform this action!')
  }
}

/**
  * Checks if one of the date is missing and autocalculates it.
  * @param {Object} data workPeriod data object
  */
function _autoCalculateDates (data) {
  if (data.startDate && !data.endDate) {
    const date = new Date(data.startDate)
    date.setDate(date.getDate() + 6)
    data.endDate = date
  } else if (!data.startDate && data.endDate) {
    const date = new Date(data.endDate)
    date.setDate(date.getDate() - 6)
    data.startDate = date
  }
}

/**
  * Get workPeriod by id
  * @param {Object} currentUser the user who perform this operation.
  * @param {String} id the workPeriod id
  * @returns {Object} the workPeriod
  */
async function getWorkPeriod (currentUser, id) {
  // get query options according to currentUser
  const queryOpt = _getWorkPeriodFilteringFields(currentUser)

  logger.info({ component: 'WorkPeriodService', context: 'getWorkPeriod', message: 'try to query db for data' })
  const workPeriod = await WorkPeriod.findById(id, { withPayments: queryOpt.withPayments, exclude: queryOpt.excludeDB })

  await _checkUserPermissionForGetWorkPeriod(currentUser, workPeriod.projectId) // check user permission
  return workPeriod.dataValues
}

getWorkPeriod.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  id: Joi.string().guid().required(),
  fromDb: Joi.boolean()
}).required()

/**
  * Create workPeriod
  * @param {Object} workPeriod the workPeriod to be created
  * @returns {Object} the created workPeriod
  */
async function createWorkPeriod (workPeriod) {
  // If one of the dates are missing then auto-calculate it
  _autoCalculateDates(workPeriod)

  const resourceBooking = await helper.ensureResourceBookingById(workPeriod.resourceBookingId) // ensure resource booking exists
  workPeriod.projectId = resourceBooking.projectId

  const tcUser = await helper.ensureTopcoderUserIdExists(resourceBooking.userId) // ensure user exists
  workPeriod.userHandle = tcUser.handleLower

  workPeriod.id = uuid.v4()
  workPeriod.createdBy = config.m2m.M2M_AUDIT_USER_ID

  const key = `resourceBooking.id:${workPeriod.resourceBookingId}`

  let entity
  try {
    await sequelize.transaction(async (t) => {
      const created = await WorkPeriod.create(workPeriod, { transaction: t })
      entity = created.toJSON()
    })
  } catch (err) {
    if (entity) {
      helper.postErrorEvent(config.TAAS_ERROR_TOPIC, entity, 'workperiod.create')
    }
    if (!_.isUndefined(err.original)) {
      throw new errors.BadRequestError(err.original.detail)
    } else {
      throw err
    }
  }
  await helper.postEvent(config.TAAS_WORK_PERIOD_CREATE_TOPIC, entity, { key })
  return entity
}

createWorkPeriod.schema = Joi.object().keys({
  workPeriod: Joi.object().keys({
    resourceBookingId: Joi.string().uuid().required(),
    startDate: Joi.workPeriodStartDate(),
    endDate: Joi.workPeriodEndDate(),
    sentSurvey: Joi.boolean().default(false),
    daysWorked: Joi.number().integer().min(0).max(5).required(),
    daysPaid: Joi.number().default(0).forbidden(),
    paymentTotal: Joi.number().default(0).forbidden(),
    paymentStatus: Joi.paymentStatus().required()
  }).required()
}).required()

/**
  * Update workPeriod
  * @param {Object} currentUser the user who perform this operation
  * @param {String} id the workPeriod id
  * @param {Object} data the data to be updated
  * @returns {Object} the updated workPeriod
  */
async function updateWorkPeriod (currentUser, id, data) {
  // check permission
  await _checkUserPermissionForWriteWorkPeriod(currentUser)

  const workPeriod = await WorkPeriod.findById(id, { withPayments: true })
  const oldValue = workPeriod.toJSON()
  if (data.daysWorked < oldValue.daysPaid) {
    throw new errors.BadRequestError(`Cannot update daysWorked (${data.daysWorked}) to the value less than daysPaid (${oldValue.daysPaid})`)
  }
  const resourceBooking = await helper.ensureResourceBookingById(oldValue.resourceBookingId)
  const weeks = helper.extractWorkPeriods(resourceBooking.startDate, resourceBooking.endDate)
  if (_.isEmpty(weeks)) {
    throw new errors.ConflictError('Resource booking has missing dates')
  }
  const thisWeek = _.find(weeks, ['startDate', oldValue.startDate])
  if (_.isNil(thisWeek)) {
    throw new errors.ConflictError('Work Period dates are not compatible with Resource Booking dates')
  }
  data.paymentStatus = helper.calculateWorkPeriodPaymentStatus(_.assign({}, oldValue, data))
  if (!currentUser.isMachine) {
    data.updatedBy = await helper.getUserId(currentUser.userId)
  }
  const key = `resourceBooking.id:${workPeriod.resourceBookingId}`
  let entity
  try {
    await sequelize.transaction(async (t) => {
      const updated = await workPeriod.update(data, { transaction: t })
      entity = updated.toJSON()

      entity = _.omit(entity, ['payments'])
    })
  } catch (e) {
    if (entity) {
      helper.postErrorEvent(config.TAAS_ERROR_TOPIC, entity, 'workperiod.update')
    }
    throw e
  }
  const oldValueWithoutPayments = _.omit(oldValue, ['payments'])
  await helper.postEvent(config.TAAS_WORK_PERIOD_UPDATE_TOPIC, entity, { oldValue: oldValueWithoutPayments, key })
  return entity
}

/**
  * Partially update workPeriod by id
  * @param {Object} currentUser the user who perform this operation
  * @param {String} id the workPeriod id
  * @param {Object} data the data to be updated
  * @returns {Object} the updated workPeriod
  */
async function partiallyUpdateWorkPeriod (currentUser, id, data) {
  return updateWorkPeriod(currentUser, id, data)
}

partiallyUpdateWorkPeriod.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  id: Joi.string().uuid().required(),
  data: Joi.object().keys({
    daysWorked: Joi.number().integer().min(0).max(10),
    sentSurvey: Joi.boolean(),
    sentSurveyError: Joi.object().keys({
      errorCode: Joi.number().integer().min(0),
      errorMessage: Joi.string()
    })
  }).required().min(1)
}).required()

/**
  * Delete workPeriod by id
  * @param {String} id the workPeriod id
  */
async function deleteWorkPeriod (id) {
  const workPeriod = await WorkPeriod.findById(id, { withPayments: true })
  if (_.some(workPeriod.payments, payment => constants.ActiveWorkPeriodPaymentStatuses.indexOf(payment.status) !== -1)) {
    throw new errors.BadRequestError(`Can't delete WorkPeriod as it has associated WorkPeriodsPayment with one of statuses ${constants.ActiveWorkPeriodPaymentStatuses.join(', ')}`)
  }

  const key = `resourceBooking.id:${workPeriod.resourceBookingId}`
  try {
    await sequelize.transaction(async (t) => {
      await models.WorkPeriodPayment.destroy({
        where: {
          workPeriodId: id
        },
        transaction: t
      })
      await workPeriod.destroy({ transaction: t })
    })
  } catch (e) {
    helper.postErrorEvent(config.TAAS_ERROR_TOPIC, { id }, 'workperiod.delete')
    throw e
  }
  await helper.postEvent(config.TAAS_WORK_PERIOD_DELETE_TOPIC, { id }, { key })
}

deleteWorkPeriod.schema = Joi.object().keys({
  id: Joi.string().uuid().required()
}).required()

/**
  * List workPeriods
  * @param {Object} currentUser the user who perform this operation.
  * @param {Object} criteria the search criteria
  * @param {Object} options the extra options to control the function
  * @returns {Object} the search result, contain total/page/perPage and result array
  */
async function searchWorkPeriods (currentUser, criteria, options = { returnAll: false }) {
  // check user permission
  if (!currentUser.hasManagePermission && !currentUser.isMachine && !currentUser.isConnectManager && !options.returnAll) {
    if (!criteria.projectId) { // regular user can only search with filtering by "projectId"
      throw new errors.ForbiddenError('Not allowed without filtering by "projectId"')
    }
    await helper.checkIsMemberOfProject(currentUser.userId, criteria.projectId)
  }
  const queryOpt = _getWorkPeriodFilteringFields(currentUser)
  // `criteria.resourceBookingIds` could be array of ids, or comma separated string of ids
  // in case it's comma separated string of ids we have to convert it to an array of ids
  if ((typeof criteria.resourceBookingIds) === 'string') {
    criteria.resourceBookingIds = criteria.resourceBookingIds.trim().split(',').map(resourceBookingIdRaw => {
      const resourceBookingId = resourceBookingIdRaw.trim()
      if (!uuid.validate(resourceBookingId)) {
        throw new errors.BadRequestError(`resourceBookingId ${resourceBookingId} is not a valid uuid`)
      }
      return resourceBookingId
    })
  }
  // `criteria.paymentStatus` could be array of paymentStatus, or comma separated string of paymentStatus
  // in case it's comma separated string of paymentStatus we have to convert it to an array of paymentStatus
  if ((typeof criteria.paymentStatus) === 'string') {
    criteria.paymentStatus = criteria.paymentStatus.trim().split(',').map(ps => Joi.attempt({ paymentStatus: ps.trim() }, Joi.object().keys({ paymentStatus: Joi.paymentStatus() })).paymentStatus)
  }
  const page = criteria.page
  const perPage = criteria.perPage
  if (!criteria.sortBy) {
    criteria.sortBy = 'id'
  }
  if (!criteria.sortOrder) {
    criteria.sortOrder = 'desc'
  }
  logger.info({ component: 'WorkPeriodService', context: 'searchWorkPeriods', message: 'fallback to DB query' })
  const filter = { [Op.and]: [] }
  _.each(_.pick(criteria, ['resourceBookingId', 'userHandle', 'projectId', 'startDate', 'endDate', 'paymentStatus']), (value, key) => {
    filter[Op.and].push({ [key]: value })
  })
  if (criteria.resourceBookingIds) {
    filter[Op.and].push({ resourceBookingId: criteria.resourceBookingIds })
  }
  const queryCriteria = {
    where: filter,
    offset: ((page - 1) * perPage),
    limit: perPage,
    order: [[criteria.sortBy, criteria.sortOrder]]
  }
  // add excluded fields criteria
  if (queryOpt.excludeDB.length > 0) {
    queryCriteria.attributes = { exclude: queryOpt.excludeDB }
  }
  // include WorkPeriodPayment model
  if (queryOpt.withPayments) {
    queryCriteria.include = [{
      model: models.WorkPeriodPayment,
      as: 'payments',
      required: false
    }]
  }
  const workPeriods = await WorkPeriod.findAll(queryCriteria)
  const total = await WorkPeriod.count({ where: filter })
  return {
    fromDb: true,
    total,
    page,
    perPage,
    result: workPeriods
  }
}

searchWorkPeriods.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  criteria: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1),
    perPage: Joi.number().integer().min(1).max(10000).default(20),
    sortBy: Joi.string().valid('id', 'resourceBookingId', 'userHandle', 'projectId', 'startDate', 'endDate', 'daysWorked', 'customerRate', 'memberRate', 'paymentStatus'),
    sortOrder: Joi.string().valid('desc', 'asc'),
    paymentStatus: Joi.alternatives(
      Joi.string(),
      Joi.array().items(Joi.paymentStatus())
    ),
    startDate: Joi.date().format('YYYY-MM-DD'),
    endDate: Joi.date().format('YYYY-MM-DD'),
    userHandle: Joi.string(),
    projectId: Joi.number().integer(),
    resourceBookingId: Joi.string().uuid(),
    sentSurvey: Joi.boolean(),
    sentSurveyError: Joi.object().keys({
      errorCode: Joi.number().integer().min(0),
      errorMessage: Joi.string()
    }),
    resourceBookingIds: Joi.alternatives(
      Joi.string(),
      Joi.array().items(Joi.string().uuid())
    )
  }).required(),
  options: Joi.object()
}).required()

module.exports = {
  getWorkPeriod,
  createWorkPeriod,
  partiallyUpdateWorkPeriod,
  deleteWorkPeriod,
  searchWorkPeriods
}
