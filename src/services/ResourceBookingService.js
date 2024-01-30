/* eslint-disable no-unreachable */
/**
 * This service provides operations of ResourceBooking.
 */

const _ = require('lodash')
const Joi = require('joi').extend(require('@joi/date'))
const { Op } = require('sequelize')
const { v4: uuid } = require('uuid')
const helper = require('../common/helper')
const logger = require('../common/logger')
const errors = require('../common/errors')
const models = require('../models')
const constants = require('../../app-constants')
const moment = require('moment')
const config = require('config')

const ResourceBooking = models.ResourceBooking
const WorkPeriod = models.WorkPeriod
const WorkPeriodPayment = models.WorkPeriodPayment
const cachedModelFields = _cacheModelFields()

const sequelize = models.sequelize

/**
 * Get the fields of the ResourceBooking model and the nested WorkPeriod model
 * @returns {Array<string>} array of field names
 */
function _cacheModelFields () {
  const resourceBookingFields = _.keys(ResourceBooking.rawAttributes)
  const workPeriodFields = _.map(_.keys(WorkPeriod.rawAttributes), key => `workPeriods.${key}`)
  const workPeriodPaymentFields = _.map(_.keys(WorkPeriodPayment.rawAttributes), key => `workPeriods.payments.${key}`)
  return [...resourceBookingFields, 'workPeriods', ...workPeriodFields, 'workPeriods.payments', ...workPeriodPaymentFields]
}

/**
 * Check user scopes for getting workPeriods
 * @param {Object} currentUser the user who perform this operation.
 * @returns {Boolean} true if user is machine and has read/all workPeriod scopes
 */
function _checkUserScopesForGetWorkPeriods (currentUser) {
  const getWorkPeriodsScopes = [constants.Scopes.READ_WORK_PERIOD, constants.Scopes.ALL_WORK_PERIOD]
  return currentUser.isMachine && helper.checkIfExists(getWorkPeriodsScopes, currentUser.scopes)
}

/**
 * Check user scopes for getting workPeriodPayments
 * @param {Object} currentUser the user who perform this operation.
 * @returns {Boolean} true if user is machine and has read/all workPeriodPayment scopes
 */
function _checkUserScopesForGetWorkPeriodPayments (currentUser) {
  const getWorkPeriodPaymentsScopes = [constants.Scopes.READ_WORK_PERIOD_PAYMENT, constants.Scopes.ALL_WORK_PERIOD_PAYMENT]
  return currentUser.isMachine && helper.checkIfExists(getWorkPeriodPaymentsScopes, currentUser.scopes)
}

/**
 * Evaluates the criterias and returns the fields
 * to be returned as a result of GET endpoints
 * @param {Object} currentUser the user who perform this operation.
 * @param {Object} criteria the query criterias
 * @returns {Object} result
 * @returns {Array<string>} result.include field names to include
 * @returns {Array<string>} result.fieldsRB ResourceBooking field names to include
 * @returns {Array<string>} result.fieldsWP WorkPeriod field names to include
 * @returns {Array<string>} result.fieldsWPP WorkPeriodPayment field names to include
 * @returns {Array<string>} result.excludeRB ResourceBooking field names to exclude
 * @returns {Array<string>} result.excludeWP WorkPeriod field names to exclude
 * @returns {Boolean} result.regularUser is current user a regular user?
 * @returns {Boolean} result.allWorkPeriods will all WorkPeriod fields be returned?
 * @returns {Boolean} result.withWorkPeriods does fields include any WorkPeriod field?
 * @returns {Boolean} result.allWorkPeriodPayments will all WorkPeriodPayment fields be returned?
 * @returns {Boolean} result.withWorkPeriodPayments does fields include any WorkPeriodPayment field?
 * @returns {Boolean} result.sortByWP will the sorting be done by WorkPeriod field?
 * @throws  {BadRequestError}
 * @throws  {ForbiddenError}
 */
function _checkCriteriaAndGetFields (currentUser, criteria) {
  const result = {
    include: [],
    fieldsRB: [],
    fieldsWP: [],
    fieldsWPP: [],
    excludeRB: [],
    excludeWP: [],
    excludeWPP: []
  }
  const fields = criteria.fields
  const sort = criteria.sortBy
  const onlyResourceBooking = _.isUndefined(fields)
  const query = onlyResourceBooking ? [] : _.uniq(_.filter(_.map(_.split(fields, ','), _.trim), field => !_.isEmpty(field)))
  const notAllowedFields = _.difference(query, cachedModelFields)
  // Check if fields criteria has a field name that RB or WP models don't have
  if (notAllowedFields.length > 0) {
    throw new errors.BadRequestError(`${notAllowedFields} are not allowed`)
  }
  // Check if user is a regular user. Regular users can't get ResourceBookings for which they are not a member
  result.regularUser = !currentUser.hasManagePermission && !currentUser.isMachine && !currentUser.isConnectManager
  // Check if all WorkPeriod fields will be returned
  result.allWorkPeriods = _.some(query, q => q === 'workPeriods')
  // Check if all WorkPeriodPayment fields will be returned
  result.allWorkPeriodPayments = result.allWorkPeriods || _.some(query, q => q === 'workPeriods.payments')
  // Split the fields criteria into ResourceBooking and WorkPeriod fields
  _.forEach(query, q => {
    if (_.includes(q, 'payments.')) { result.fieldsWPP.push(q) } else if (q !== 'workPeriods.payments' && _.includes(q, '.')) { result.fieldsWP.push(q) } else if (q !== 'workPeriods' && q !== 'workPeriods.payments') { result.fieldsRB.push(q) }
  })
  // Check if any WorkPeriod field will be returned
  result.withWorkPeriods = result.allWorkPeriods || result.fieldsWP.length > 0 ||
  result.allWorkPeriodPayments || result.fieldsWPP.length > 0
  // Check if any WorkPeriodPayment field will be returned
  result.withWorkPeriodPayments = result.allWorkPeriodPayments || result.fieldsWPP.length > 0
  // Extract the filters from criteria parameter
  let filters = _.filter(Object.keys(criteria), key => _.indexOf(['fromDb', 'fields', 'page', 'perPage', 'sortBy', 'sortOrder', 'jobIds', 'workPeriods.isFirstWeek', 'workPeriods.isLastWeek'], key) === -1)
  filters = _.map(filters, f => {
    if (f === 'projectIds') {
      return 'projectId'
    } return f
  })
  const filterRB = []
  const filterWP = []
  const filterWPP = []
  // Split the filters criteria into ResourceBooking, WorkPeriod and WorkPeriodPayment filters
  _.forEach(filters, q => { if (_.includes(q, 'payments.')) { filterWPP.push(q) } else if (_.includes(q, '.')) { filterWP.push(q) } else { filterRB.push(q) } })
  // Check if filter criteria has any WorkPeriod or payments filter
  const filterHasWorkPeriods = filterWP.length > 0 || filterWPP.length > 0
  // Check if sorting will be done by WorkPeriod field
  result.sortByWP = _.split(sort, '.')[0] === 'workPeriods'
  // Check if the current user has the right to see the memberRate
  const canSeeMemberRate = currentUser.hasManagePermission || currentUser.isMachine
  // If current user has no right to see the memberRate then it's excluded.
  // "currentUser.isMachine" to be true is not enough to return "workPeriods.memberRate"
  // but returning "workPeriod" will be evaluated later
  if (!canSeeMemberRate) {
    result.excludeRB.push('paymentTotal')
    result.excludeWP.push('workPeriods.paymentTotal')
    result.excludeWPP.push('workPeriods.payments')
  }
  // if "fields" is not included in cretia, then only ResourceBooking model will be returned
  // No further evaluation is required as long as the criteria does not include a WorkPeriod filter or a WorkPeriod sorting condition
  if (onlyResourceBooking) {
    if (filterHasWorkPeriods || result.sortByWP) {
      throw new errors.BadRequestError('Can not filter or sort by some field which is not included in fields')
    }
    result.excludeWP.push('workPeriods')
    return result
  }
  // Include sorting condition in filters
  if (result.sortByWP) {
    // It is required to filter by "workPeriods.startDate" or "workPeriods.endDate" if sorting will be done by WorkPeriod field
    if (!_.some(filterWP, f => _.includes(['workPeriods.startDate', 'workPeriods.endDate'], f))) {
      throw new errors.BadRequestError('Can not sort by workPeriod field without filtering by workPeriods.startDate or workPeriods.endDate')
    }
    filterWP.push(sort)
  } else if (!_.isUndefined(sort) && sort !== 'id') {
    filterRB.push(sort)
  }
  // Check If it's tried to filter or sort by some field which should not be included as per rules of fields param
  if (_.difference(filterRB, result.fieldsRB).length > 0) {
    throw new errors.BadRequestError('Can not filter or sort by ResourceBooking field which is not included in fields')
  }
  // Check If it's tried to filter or sort by some field which should not be included as per rules of fields param
  if (!result.allWorkPeriods && _.difference(filterWP, result.fieldsWP).length > 0) {
    throw new errors.BadRequestError('Can not filter or sort by WorkPeriod field which is not included in fields')
  }
  // Check If it's tried to filter or sort by some field which should not be included as per rules of fields param
  if (!result.allWorkPeriodPayments && _.difference(filterWPP, result.fieldsWPP).length > 0) {
    throw new errors.BadRequestError('Can not filter by WorkPeriodPayment field which is not included in fields')
  }
  // Check if the current user has no right to see the memberRate and memberRate is included in fields parameter
  if (!canSeeMemberRate && _.some(query, q => _.includes(['memberRate', 'workPeriods.paymentTotal', 'workPeriods.payments'], q))) {
    throw new errors.ForbiddenError('You don\'t have access to view memberRate, paymentTotal and payments')
  }
  // Check if the current user has no right to see the workPeriods and workPeriods is included in fields parameter
  if (currentUser.isMachine && result.withWorkPeriods && !_checkUserScopesForGetWorkPeriods(currentUser)) {
    throw new errors.ForbiddenError('You don\'t have access to view workPeriods')
  }
  // Check if the current user has no right to see the workPeriodPayments and workPeriodPayments is included in fields parameter
  if (currentUser.isMachine && result.withWorkPeriodPayments && !_checkUserScopesForGetWorkPeriodPayments(currentUser)) {
    throw new errors.ForbiddenError('You don\'t have access to view workPeriodPayments')
  }
  result.include.push(...query)
  return result
}

/**
 * Check user permission for getting resource booking.
 *
 * @param {Object} currentUser the user who perform this operation.
 * @param {String} projectId the project id
 * @returns {undefined}
 */
async function _checkUserPermissionForGetResourceBooking (currentUser, projectId) {
  await helper.checkIsMemberOfProject(currentUser.userId, projectId)
}

/**
 * Check if any work period is paid and tried to be deleted
 *
 * @param {string} resourceBookingId workPeriod object array.
 * @param {Object} [oldValue] old value of resourceBooking object.
 * @param {Object} [newValue] new value of resourceBooking object.
 * @throws {BadRequestError}
 */
async function _ensurePaidWorkPeriodsNotDeleted (resourceBookingId, oldValue, newValue) {
  function _checkForPaidWorkPeriods (workPeriods) {
    const paidWorkPeriods = _.filter(workPeriods, workPeriod => {
      // filter by WP and WPP status
      return _.some(workPeriod.payments, payment => constants.ActiveWorkPeriodPaymentStatuses.indexOf(payment.status) !== -1)
    })
    if (paidWorkPeriods.length > 0) {
      throw new errors.BadRequestError(`Can't delete associated WorkPeriods ${_.map(paidWorkPeriods, workPeriod => workPeriod.id)}
       as they have associated WorkPeriodsPayment with one of statuses ${constants.ActiveWorkPeriodPaymentStatuses.join(', ')}.`)
    }
  }
  // find related workPeriods to evaluate the changes
  // We don't need to include WPP because WPP's status changes should
  // update WP's status. In case of any bug or slow processing, it's better to check both WP
  // and WPP status for now.
  let workPeriods = await WorkPeriod.findAll({
    where: {
      resourceBookingId: resourceBookingId
    },
    attributes: ['id', 'paymentStatus', 'startDate', 'endDate', 'daysPaid'],
    include: [{
      model: WorkPeriodPayment,
      as: 'payments',
      required: false,
      attributes: ['status']
    }]
  })
  workPeriods = _.map(workPeriods, wp => wp.toJSON())
  // oldValue and newValue are not provided at deleteResourceBooking process
  if (_.isUndefined(oldValue) || _.isUndefined(newValue)) {
    _checkForPaidWorkPeriods(workPeriods)
    return
  }
  // We should not be able to change status of ResourceBooking to 'cancelled'
  // if there is at least one associated Work Period with paymentStatus 'partially-completed', 'completed' or 'in-progress',
  // or any of it's WorkPeriodsPayment has status 'completed' or 'in-progress'.
  if (oldValue.status !== 'cancelled' && newValue.status === 'cancelled') {
    _checkForPaidWorkPeriods(workPeriods)
    // we have already checked all existing workPeriods
    return
  }
  // gather workPeriod dates from provided dates
  const newWorkPeriods = helper.extractWorkPeriods(
    _.isUndefined(newValue.startDate) ? oldValue.startDate : newValue.startDate,
    _.isUndefined(newValue.endDate) ? oldValue.endDate : newValue.endDate)
  // find which workPeriods should be removed
  const workPeriodsToRemove = _.differenceBy(workPeriods, newWorkPeriods, 'startDate')
  // we can't delete workperiods with paymentStatus 'partially-completed', 'completed' or 'in-progress',
  // or any of it's WorkPeriodsPayment has status 'completed' or 'in-progress'.
  _checkForPaidWorkPeriods(workPeriodsToRemove)
}

/**
 * Get resourceBooking by id
 * @param {Object} currentUser the user who perform this operation.
 * @param {String} id the resourceBooking id
 * @param {Object} criteria object including fields and fromDb criteria
 * @returns {Object} the resourceBooking
 */
async function getResourceBooking (currentUser, id, criteria) {
  // Evaluate criteria and extract the fields to be included or excluded
  const queryOpt = _checkCriteriaAndGetFields(currentUser, criteria)
  // We don't allow regular user to exclude projectId from result
  if (queryOpt.regularUser && queryOpt.include.length > 0 && !_.includes(queryOpt.include, 'projectId')) {
    throw new errors.ForbiddenError('Not allowed without including "projectId"')
  }
  logger.info({ component: 'ResourceBookingService', context: 'getResourceBooking', message: 'try to query db for data' })
  let resourceBooking = await ResourceBooking.findById(id, queryOpt)
  resourceBooking = resourceBooking.toJSON()
  // omit workPeriod.id if fields criteria has no workPeriod field but have workPeriodPayment field
  if (queryOpt.withWorkPeriods && !queryOpt.allWorkPeriods && (!queryOpt.fieldsWP || queryOpt.fieldsWP.length === 0)) {
    if (_.isArray(resourceBooking.workPeriods)) {
      resourceBooking.workPeriods = _.map(resourceBooking.workPeriods, wp => _.omit(wp, 'id'))
    }
  }
  if (queryOpt.regularUser) {
    await _checkUserPermissionForGetResourceBooking(currentUser, resourceBooking.projectId) // check user permission
  }
  return resourceBooking
}

getResourceBooking.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  id: Joi.string().guid().required(),
  criteria: Joi.object().keys({
    fromDb: Joi.boolean().default(false),
    fields: Joi.string()
  })
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
  await helper.ensureTopcoderUserIdExists(resourceBooking.userId) // ensure user exists

  resourceBooking.id = uuid()
  resourceBooking.createdBy = toString(await helper.getUserId(currentUser.userId))

  let entity
  try {
    await sequelize.transaction(async (t) => {
      entity = (await ResourceBooking.create(resourceBooking, { transaction: t })).toJSON()
    })
  } catch (e) {
    if (entity) {
      helper.postErrorEvent(config.TAAS_ERROR_TOPIC, entity, 'resourcebooking.create')
    }
    throw e
  }
  await helper.postEvent(config.TAAS_RESOURCE_BOOKING_CREATE_TOPIC, entity)
  return entity
}

createResourceBooking.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  resourceBooking: Joi.object().keys({
    status: Joi.resourceBookingStatus().default('placed'),
    projectId: Joi.number().integer().required(),
    userId: Joi.string().required(),
    jobId: Joi.string().uuid().allow(null),
    sendWeeklySurvey: Joi.boolean().default(true),
    startDate: Joi.date().format('YYYY-MM-DD').allow(null),
    endDate: Joi.date().format('YYYY-MM-DD').when('startDate', {
      is: Joi.exist(),
      then: Joi.date().format('YYYY-MM-DD').allow(null).min(Joi.ref('startDate')
      ).messages({
        'date.min': 'endDate cannot be earlier than startDate'
      }),
      otherwise: Joi.date().format('YYYY-MM-DD').allow(null)
    }),
    memberRate: Joi.number().allow(null),
    customerRate: Joi.number().allow(null),
    rateType: Joi.rateType().required(),
    billingAccountId: Joi.number().allow(null)
  }).required()
}).required()

/**
 * Update resourceBooking
 * @param {Object} currentUser the user who perform this operation
 * @param {String} id the resourceBooking id
 * @param {Object} data the data to be updated
 * @returns {Object} the updated resourceBooking
 */
async function updateResourceBooking (currentUser, id, data) {
  // check permission
  if (!currentUser.hasManagePermission && !currentUser.isMachine) {
    throw new errors.ForbiddenError('You are not allowed to perform this action!')
  }

  const resourceBooking = await ResourceBooking.findById(id)
  const oldValue = resourceBooking.toJSON()
  // We can't remove dates of Resource Booking once they are both set
  if (!_.isNil(oldValue.startDate) && !_.isNil(oldValue.endDate) && (_.isNull(data.startDate) || _.isNull(data.endDate))) {
    throw new errors.BadRequestError('You cannot remove start or end date if both are already set for Resource Booking.')
  }
  // before updating the record, we need to check if any paid work periods tried to be deleted
  await _ensurePaidWorkPeriodsNotDeleted(id, oldValue, data)

  data.updatedBy = toString(await helper.getUserId(currentUser.userId))

  let entity
  try {
    await sequelize.transaction(async (t) => {
      entity = (await resourceBooking.update(data, { transaction: t })).toJSON()
    })
  } catch (e) {
    if (entity) {
      helper.postErrorEvent(config.TAAS_ERROR_TOPIC, entity, 'resourcebooking.update')
    }
    throw e
  }
  await helper.postEvent(config.TAAS_RESOURCE_BOOKING_UPDATE_TOPIC, entity, { oldValue: oldValue })
  return entity
}

/**
 * Partially update resourceBooking by id
 * @param {Object} currentUser the user who perform this operation
 * @param {String} id the resourceBooking id
 * @param {Object} data the data to be updated
 * @returns {Object} the updated resourceBooking
 */
async function partiallyUpdateResourceBooking (currentUser, id, data) {
  return updateResourceBooking(currentUser, id, data)
}

partiallyUpdateResourceBooking.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  id: Joi.string().uuid().required(),
  data: Joi.object().keys({
    status: Joi.resourceBookingStatus(),
    startDate: Joi.date().format('YYYY-MM-DD').allow(null),
    endDate: Joi.date().format('YYYY-MM-DD').when('startDate', {
      is: Joi.exist(),
      then: Joi.date().format('YYYY-MM-DD').allow(null).min(Joi.ref('startDate')
      ).messages({
        'date.min': 'endDate cannot be earlier than startDate'
      }),
      otherwise: Joi.date().format('YYYY-MM-DD').allow(null)
    }),
    memberRate: Joi.number().allow(null),
    customerRate: Joi.number().allow(null),
    rateType: Joi.rateType(),
    sendWeeklySurvey: Joi.boolean(),
    billingAccountId: Joi.number().allow(null)
  }).required()
}).required()

/**
 * Fully update resourceBooking by id
 * @param {Object} currentUser the user who perform this operation
 * @param {String} id the resourceBooking id
 * @param {Object} data the data to be updated
 * @returns {Object} the updated resourceBooking
 */
async function fullyUpdateResourceBooking (currentUser, id, data) {
  if (data.jobId) {
    await helper.ensureJobById(data.jobId) // ensure job exists
  }
  await helper.ensureTopcoderUserIdExists(data.userId) // ensure user exists
  return updateResourceBooking(currentUser, id, data)
}

fullyUpdateResourceBooking.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  id: Joi.string().uuid().required(),
  data: Joi.object().keys({
    projectId: Joi.number().integer().required(),
    userId: Joi.string().required(),
    jobId: Joi.string().uuid().allow(null).default(null),
    startDate: Joi.date().format('YYYY-MM-DD').allow(null).default(null),
    endDate: Joi.date().format('YYYY-MM-DD').when('startDate', {
      is: Joi.exist(),
      then: Joi.date().format('YYYY-MM-DD').allow(null).default(null).min(Joi.ref('startDate')
      ).messages({
        'date.min': 'endDate cannot be earlier than startDate'
      }),
      otherwise: Joi.date().format('YYYY-MM-DD').allow(null).default(null)
    }),
    memberRate: Joi.number().allow(null).default(null),
    customerRate: Joi.number().allow(null).default(null),
    rateType: Joi.rateType().required(),
    status: Joi.resourceBookingStatus().required(),
    sendWeeklySurvey: Joi.boolean().default(true),
    billingAccountId: Joi.number().allow(null).default(null)
  }).required()
}).required()

/**
 * Delete resourceBooking by id
 * @param {Object} currentUser the user who perform this operation
 * @param {String} id the resourceBooking id
 */
async function deleteResourceBooking (currentUser, id) {
  // check permission
  if (!currentUser.hasManagePermission && !currentUser.isMachine) {
    throw new errors.ForbiddenError('You are not allowed to perform this action!')
  }

  // we can't delete workperiods with paymentStatus 'partially-completed' or 'completed'.
  await _ensurePaidWorkPeriodsNotDeleted(id)
  const resourceBooking = await ResourceBooking.findById(id)

  try {
    await sequelize.transaction(async (t) => {
      await resourceBooking.destroy({ transaction: t })
    })
  } catch (e) {
    helper.postErrorEvent(config.TAAS_ERROR_TOPIC, { id }, 'resourcebooking.delete')
    throw e
  }
  await helper.postEvent(config.TAAS_RESOURCE_BOOKING_DELETE_TOPIC, { id })
}

deleteResourceBooking.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  id: Joi.string().guid().required()
}).required()

/**
 * List resourceBookings
 * @param {Object} currentUser the user who perform this operation.
 * @param {Object} criteria the search criteria
 * @param {Object} options the extra options to control the function
 * @returns {Object} the search result, contain total/page/perPage and result array
 */
async function searchResourceBookings (currentUser, criteria, options) {
  // Evaluate criteria and extract the fields to be included or excluded
  const queryOpt = _checkCriteriaAndGetFields(currentUser, criteria)
  // check user permission
  if (queryOpt.regularUser && !options.returnAll) {
    if (!criteria.projectId) { // regular user can only search with filtering by "projectId"
      throw new errors.ForbiddenError('Not allowed without filtering by "projectId"')
    }
    await _checkUserPermissionForGetResourceBooking(currentUser, criteria.projectId)
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
  // `criteria[workPeriods.paymentStatus]` could be array of paymentStatus, or comma separated string of paymentStatus
  // in case it's comma separated string of paymentStatus we have to convert it to an array of paymentStatus
  if ((typeof criteria['workPeriods.paymentStatus']) === 'string') {
    criteria['workPeriods.paymentStatus'] = criteria['workPeriods.paymentStatus'].trim().split(',').map(ps => Joi.attempt({ paymentStatus: ps.trim() }, Joi.object().keys({ paymentStatus: Joi.paymentStatus() })).paymentStatus)
  }
  const page = criteria.page
  let perPage
  if (options.returnAll) {
    // To simplify the logic we are use a very large number for perPage
    // because in practice there could hardly be so many records to be returned.(also consider we are using filters in the meantime)
    // the number is limited by `index.max_result_window`, its default value is 10000, see
    // https://www.elastic.co/guide/en/elasticsearch/reference/current/index-modules.html#index-max-result-window
    perPage = 10000
  } else {
    perPage = criteria.perPage
  }

  if (!criteria.sortBy) {
    criteria.sortBy = 'id'
  }
  if (!criteria.sortOrder) {
    criteria.sortOrder = 'desc'
  }

  if (_.has(criteria, 'workPeriods.sentSurveyError') && !criteria['workPeriods.sentSurveyError']) {
    criteria['workPeriods.sentSurveyError'] = null
  }

  logger.info({ component: 'ResourceBookingService', context: 'searchResourceBookings', message: 'fallback to DB query' })
  const filter = { [Op.and]: [] }
  // Apply ResourceBooking filters
  _.each(_.pick(criteria, ['sendWeeklySurvey', 'status', 'startDate', 'endDate', 'rateType', 'projectId', 'jobId', 'userId']), (value, key) => {
    filter[Op.and].push({ [key]: value })
  })
  if (!_.isUndefined(criteria.billingAccountId)) {
    filter[Op.and].push({ billingAccountId: criteria.billingAccountId === 0 ? null : criteria.billingAccountId })
  }
  if (criteria.projectIds) {
    filter[Op.and].push({ projectId: criteria.projectIds })
  }
  if (criteria.jobIds && criteria.jobIds.length > 0) {
    filter[Op.and].push({ id: criteria.jobIds })
  }
  if (criteria['workPeriods.isFirstWeek']) {
    filter[Op.and].push({ startDate: { [Op.gte]: criteria['workPeriods.startDate'] } })
  }
  if (criteria['workPeriods.isLastWeek']) {
    filter[Op.and].push({ endDate: { [Op.lte]: moment(criteria['workPeriods.startDate']).add(6, 'day').format('YYYY-MM-DD') } })
  }
  const queryCriteria = {
    where: filter,
    offset: ((page - 1) * perPage),
    limit: perPage
  }
  // Select ResourceBooking fields
  if (queryOpt.include.length > 0) {
    queryCriteria.attributes = queryOpt.fieldsRB
  } else if (queryOpt.excludeRB && queryOpt.excludeRB.length > 0) {
    queryCriteria.attributes = { exclude: queryOpt.excludeRB }
  }
  // Include WorkPeriod Model
  if (queryOpt.withWorkPeriods) {
    queryCriteria.include = [{
      model: WorkPeriod,
      as: 'workPeriods',
      required: false,
      where: { [Op.and]: [] }
    }]
    // Select WorkPeriod fields
    if (!queryOpt.allWorkPeriods) {
      if (queryOpt.fieldsWP && queryOpt.fieldsWP.length > 0) {
        queryCriteria.include[0].attributes = _.map(queryOpt.fieldsWP, f => _.split(f, '.')[1])
      } else {
        // we should include at least one workPeriod field
        // if fields criteria has no workPeriod field but have workPeriodPayment field
        queryCriteria.include[0].attributes = ['id']
      }
    } else if (queryOpt.excludeWP && queryOpt.excludeWP.length > 0) {
      queryCriteria.include[0].attributes = { exclude: _.map(queryOpt.excludeWP, f => _.split(f, '.')[1]) }
    }
    // Apply WorkPeriod filters
    _.each(_.pick(criteria, ['workPeriods.sentSurveyError', 'workPeriods.sentSurvey', 'workPeriods.startDate', 'workPeriods.endDate', 'workPeriods.paymentStatus']), (value, key) => {
      key = key.split('.')[1]
      queryCriteria.include[0].where[Op.and].push({ [key]: value })
    })
    if (criteria['workPeriods.userHandle']) {
      queryCriteria.include[0].where[Op.and].push({ userHandle: { [Op.iLike]: criteria['workPeriods.userHandle'] } })
    }
    if (queryCriteria.include[0].where[Op.and].length > 0) {
      queryCriteria.include[0].required = true
    }
    // Include WorkPeriodPayment Model
    if (queryOpt.withWorkPeriodPayments) {
      queryCriteria.include[0].include = [{
        model: WorkPeriodPayment,
        as: 'payments',
        required: false,
        where: { [Op.and]: [] }
      }]
      // Select WorkPeriodPayment fields
      if (!queryOpt.allWorkPeriodPayments) {
        queryCriteria.include[0].include[0].attributes = _.map(queryOpt.fieldsWPP, f => _.split(f, '.')[2])
      } else if (queryOpt.excludeWPP && queryOpt.excludeWPP.length > 0) {
        queryCriteria.include[0].include[0].attributes = { exclude: _.map(queryOpt.excludeWPP, f => _.split(f, '.')[2]) }
      }
      // Apply WorkPeriodPayment filters
      _.each(_.pick(criteria, ['workPeriods.payments.status', 'workPeriods.payments.days']), (value, key) => {
        key = key.split('.')[2]
        queryCriteria.include[0].include[0].where[Op.and].push({ [key]: value })
      })
      if (queryCriteria.include[0].include[0].where[Op.and].length > 0) {
        queryCriteria.include[0].required = true
        queryCriteria.include[0].include[0].required = true
      }
    }
  }
  // Apply sorting criteria
  if (!queryOpt.sortByWP) {
    queryCriteria.order = [[criteria.sortBy, `${criteria.sortOrder} NULLS LAST`]]
  } else {
    queryCriteria.subQuery = false
    queryCriteria.order = [[{ model: WorkPeriod, as: 'workPeriods' }, _.split(criteria.sortBy, '.')[1], `${criteria.sortOrder} NULLS LAST`]]
  }
  const resultModel = await ResourceBooking.findAll(queryCriteria)
  const result = _.map(resultModel, r => r.toJSON())
  // omit workPeriod.id if fields criteria has no workPeriod field but have workPeriodPayment field
  if (queryOpt.withWorkPeriods && !queryOpt.allWorkPeriods && (!queryOpt.fieldsWP || queryOpt.fieldsWP.length === 0)) {
    _.each(result, r => {
      if (_.isArray(r.workPeriods)) {
        r.workPeriods = _.map(r.workPeriods, wp => _.omit(wp, 'id'))
      }
    })
  }
  // sort Work Periods inside Resource Bookings by startDate just for comfort output
  _.each(result, r => {
    if (_.isArray(r.workPeriods)) {
      r.workPeriods = _.sortBy(r.workPeriods, ['startDate'])
    }
  })
  let countQuery
  countQuery = _.omit(queryCriteria, ['limit', 'offset', 'attributes', 'order'])
  if (queryOpt.withWorkPeriods && !queryCriteria.include[0].required) {
    countQuery = _.omit(countQuery, ['include'])
  }
  countQuery.subQuery = false
  countQuery.group = ['ResourceBooking.id']
  const total = await ResourceBooking.count(countQuery)
  return {
    fromDb: true,
    total: total.length,
    page,
    perPage,
    result
  }
}

searchResourceBookings.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  criteria: Joi.object().keys({
    fields: Joi.string(),
    page: Joi.page(),
    perPage: Joi.perPage(),
    sortBy: Joi.string().valid('id', 'rateType', 'startDate', 'endDate', 'customerRate', 'memberRate', 'status',
      'workPeriods.userHandle', 'workPeriods.daysWorked', 'workPeriods.daysPaid', 'workPeriods.paymentTotal', 'workPeriods.paymentStatus'),
    sortOrder: Joi.string().valid('desc', 'asc'),
    status: Joi.resourceBookingStatus(),
    startDate: Joi.date().format('YYYY-MM-DD'),
    endDate: Joi.date().format('YYYY-MM-DD'),
    rateType: Joi.rateType(),
    jobId: Joi.string().uuid(),
    jobIds: Joi.array().items(Joi.string().uuid()),
    userId: Joi.string(),
    projectId: Joi.number().integer(),
    projectIds: Joi.alternatives(
      Joi.string(),
      Joi.array().items(Joi.number().integer())
    ),
    sendWeeklySurvey: Joi.boolean(),
    billingAccountId: Joi.number().integer(),
    'workPeriods.paymentStatus': Joi.alternatives(
      Joi.string(),
      Joi.array().items(Joi.paymentStatus())
    ),
    'workPeriods.startDate': Joi.date().format('YYYY-MM-DD').custom((value, helpers) => {
      const date = new Date(value)
      const weekDay = date.getDay()
      if (weekDay !== 0) {
        return helpers.message('workPeriods.startDate should be always Sunday')
      }
      return value
    }),
    'workPeriods.endDate': Joi.date().format('YYYY-MM-DD').custom((value, helpers) => {
      const date = new Date(value)
      const weekDay = date.getDay()
      if (weekDay !== 6) {
        return helpers.message('workPeriods.endDate should be always Saturday')
      }
      return value
    }),
    'workPeriods.userHandle': Joi.string(),
    'workPeriods.sentSurvey': Joi.boolean(),
    'workPeriods.sentSurveyError': Joi.object().keys({
      errorCode: Joi.number().integer().min(0),
      errorMessage: Joi.string()
    }).allow('').optional(),
    'workPeriods.isFirstWeek': Joi.when(Joi.ref('workPeriods.startDate', { separator: false }), {
      is: Joi.exist(),
      then: Joi.boolean().default(false),
      otherwise: Joi.boolean().valid(false).messages({
        'any.only': 'Cannot filter by "isFirstWeek" without "startDate"'
      })
    }),
    'workPeriods.isLastWeek': Joi.boolean().when(Joi.ref('workPeriods.startDate', { separator: false }), {
      is: Joi.exist(),
      then: Joi.boolean().default(false),
      otherwise: Joi.boolean().valid(false).messages({
        'any.only': 'Cannot filter by "isLastWeek" without "startDate"'
      })
    }),
    'workPeriods.payments.status': Joi.workPeriodPaymentStatus(),
    'workPeriods.payments.days': Joi.number().integer().min(0).max(10)
  }).required(),
  options: Joi.object().keys({
    returnAll: Joi.boolean().default(false),
    returnFromDB: Joi.boolean().default(false)
  }).default({
    returnAll: false,
    returnFromDB: false
  })
}).required()

module.exports = {
  getResourceBooking,
  createResourceBooking,
  partiallyUpdateResourceBooking,
  fullyUpdateResourceBooking,
  deleteResourceBooking,
  searchResourceBookings
}
