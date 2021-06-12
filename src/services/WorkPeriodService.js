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
const constants = require('../../app-constants')
const moment = require('moment')

const WorkPeriod = models.WorkPeriod
const esClient = helper.getESClient()

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
    queryOpt.excludeES.push('workPeriods.memberRate')
    queryOpt.excludeDB.push('memberRate')
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
  * @param {Boolean} fromDb flag if query db for data or not
  * @returns {Object} the workPeriod
  */
async function getWorkPeriod (currentUser, id, fromDb = false) {
  // get query options according to currentUser
  const queryOpt = _getWorkPeriodFilteringFields(currentUser)
  if (!fromDb) {
    try {
      const resourceBooking = await esClient.search({
        index: config.esConfig.ES_INDEX_RESOURCE_BOOKING,
        _source_includes: 'workPeriods',
        _source_excludes: queryOpt.excludeES,
        body: {
          query: {
            nested: {
              path: 'workPeriods',
              query: {
                match: { 'workPeriods.id': id }
              }
            }
          }
        }
      })
      if (!resourceBooking.body.hits.total.value) {
        throw new errors.NotFoundError()
      }
      const workPeriod = _.find(resourceBooking.body.hits.hits[0]._source.workPeriods, { id })
      await _checkUserPermissionForGetWorkPeriod(currentUser, workPeriod.projectId) // check user permission
      return workPeriod
    } catch (err) {
      if (helper.isDocumentMissingException(err)) {
        throw new errors.NotFoundError(`id: ${id} "WorkPeriod" not found`)
      }
      if (err.httpStatus === HttpStatus.UNAUTHORIZED) {
        throw err
      }
      logger.logFullError(err, { component: 'WorkPeriodService', context: 'getWorkPeriod' })
    }
  }
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
  * @param {Object} currentUser the user who perform this operation
  * @param {Object} workPeriod the workPeriod to be created
  * @returns {Object} the created workPeriod
  */
async function createWorkPeriod (currentUser, workPeriod) {
  // check permission
  await _checkUserPermissionForWriteWorkPeriod(currentUser)
  // If one of the dates are missing then auto-calculate it
  _autoCalculateDates(workPeriod)

  const resourceBooking = await helper.ensureResourceBookingById(workPeriod.resourceBookingId) // ensure resource booking exists
  workPeriod.projectId = resourceBooking.projectId

  const user = await helper.ensureUserById(resourceBooking.userId) // ensure user exists
  workPeriod.userHandle = user.handle

  workPeriod.id = uuid.v4()
  workPeriod.createdBy = await helper.getUserId(currentUser.userId)

  let created = null
  try {
    created = await WorkPeriod.create(workPeriod)
  } catch (err) {
    if (!_.isUndefined(err.original)) {
      throw new errors.BadRequestError(err.original.detail)
    } else {
      throw err
    }
  }

  await helper.postEvent(config.TAAS_WORK_PERIOD_CREATE_TOPIC, created.toJSON(), { key: `resourceBooking.id:${workPeriod.resourceBookingId}` })
  return created.dataValues
}

createWorkPeriod.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  workPeriod: Joi.object().keys({
    resourceBookingId: Joi.string().uuid().required(),
    startDate: Joi.workPeriodStartDate(),
    endDate: Joi.workPeriodEndDate(),
    daysWorked: Joi.number().integer().min(0).allow(null),
    memberRate: Joi.number().allow(null),
    customerRate: Joi.number().allow(null),
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

  const workPeriod = await WorkPeriod.findById(id)
  const oldValue = workPeriod.toJSON()

  // if resourceBookingId is provided then update projectId and userHandle
  if (data.resourceBookingId) {
    const resourceBooking = await helper.ensureResourceBookingById(data.resourceBookingId) // ensure resource booking exists
    data.projectId = resourceBooking.projectId

    const user = await helper.ensureUserById(resourceBooking.userId) // ensure user exists
    data.userHandle = user.handle
  }
  // If one of the dates are missing then auto-calculate it
  _autoCalculateDates(data)

  data.updatedBy = await helper.getUserId(currentUser.userId)
  let updated = null
  try {
    updated = await workPeriod.update(data)
  } catch (err) {
    if (!_.isUndefined(err.original)) {
      throw new errors.BadRequestError(err.original.detail)
    } else {
      throw err
    }
  }

  await helper.postEvent(config.TAAS_WORK_PERIOD_UPDATE_TOPIC, updated.toJSON(), { oldValue: oldValue, key: `resourceBooking.id:${data.resourceBookingId}` })
  return updated.dataValues
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
    resourceBookingId: Joi.string().uuid(),
    startDate: Joi.workPeriodStartDate(),
    endDate: Joi.workPeriodEndDateOptional(),
    daysWorked: Joi.number().integer().min(0).allow(null),
    memberRate: Joi.number().allow(null),
    customerRate: Joi.number().allow(null),
    paymentStatus: Joi.paymentStatus()
  }).required()
}).required()

/**
  * Fully update workPeriod by id
  * @param {Object} currentUser the user who perform this operation
  * @param {String} id the workPeriod id
  * @param {Object} data the data to be updated
  * @returns {Object} the updated workPeriod
  */
async function fullyUpdateWorkPeriod (currentUser, id, data) {
  return updateWorkPeriod(currentUser, id, data)
}

fullyUpdateWorkPeriod.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  id: Joi.string().uuid().required(),
  data: Joi.object().keys({
    resourceBookingId: Joi.string().uuid().required(),
    startDate: Joi.workPeriodStartDate(),
    endDate: Joi.workPeriodEndDate(),
    daysWorked: Joi.number().integer().min(0).allow(null).default(null),
    memberRate: Joi.number().allow(null).default(null),
    customerRate: Joi.number().allow(null).default(null),
    paymentStatus: Joi.paymentStatus().required()
  }).required()
}).required()

/**
  * Delete workPeriod by id
  * @params {Object} currentUser the user who perform this operation
  * @params {String} id the workPeriod id
  */
async function deleteWorkPeriod (currentUser, id) {
  // check permission
  if (!currentUser.hasManagePermission && !currentUser.isMachine) {
    throw new errors.ForbiddenError('You are not allowed to perform this action!')
  }

  const workPeriod = await WorkPeriod.findById(id, { withPayments: true })
  if (_.includes(['completed', 'partially-completed'], workPeriod.paymentStatus)) {
    throw new errors.BadRequestError("Can't delete WorkPeriod with paymentStatus completed or partially-completed")
  }
  await models.WorkPeriodPayment.destroy({
    where: {
      workPeriodId: id
    }
  })
  await Promise.all(workPeriod.payments.map(({ id, billingAccountId }) => helper.postEvent(config.TAAS_WORK_PERIOD_PAYMENT_DELETE_TOPIC, { id }, { key: `workPeriodPayment.billingAccountId:${billingAccountId}` })))
  await workPeriod.destroy()
  await helper.postEvent(config.TAAS_WORK_PERIOD_DELETE_TOPIC, { id }, { key: `resourceBooking.id:${workPeriod.resourceBookingId}` })
}

deleteWorkPeriod.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
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
  try {
    const esQuery = {
      index: config.get('esConfig.ES_INDEX_RESOURCE_BOOKING'),
      _source_includes: 'workPeriods',
      _source_excludes: queryOpt.excludeES,
      body: {
        query: {
          nested: {
            path: 'workPeriods',
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
    // change the date format to match with database model
    if (criteria.startDate) {
      criteria.startDate = moment(criteria.startDate).format('YYYY-MM-DD')
    }
    if (criteria.endDate) {
      criteria.endDate = moment(criteria.endDate).format('YYYY-MM-DD')
    }
    // Apply filters
    _.each(_.pick(criteria, ['resourceBookingId', 'userHandle', 'projectId', 'startDate', 'endDate']), (value, key) => {
      esQuery.body.query.nested.query.bool.must.push({
        term: {
          [`workPeriods.${key}`]: {
            value
          }
        }
      })
    })
    if (criteria.paymentStatus) {
      esQuery.body.query.nested.query.bool.must.push({
        terms: {
          'workPeriods.paymentStatus': criteria.paymentStatus
        }
      })
    }
    // if criteria contains resourceBookingIds, filter resourceBookingId with this value
    if (criteria.resourceBookingIds) {
      esQuery.body.query.nested.query.bool.filter = [{
        terms: {
          'workPeriods.resourceBookingId': criteria.resourceBookingIds
        }
      }]
    }
    logger.debug({ component: 'WorkPeriodService', context: 'searchWorkPeriods', message: `Query: ${JSON.stringify(esQuery)}` })

    const { body } = await esClient.search(esQuery)
    let workPeriods = _.reduce(body.hits.hits, (acc, resourceBooking) => _.concat(acc, resourceBooking._source.workPeriods), [])
    // ESClient will return ResourceBookings with it's all nested WorkPeriods
    // We re-apply WorkPeriod filters
    _.each(_.pick(criteria, ['startDate', 'endDate']), (value, key) => {
      workPeriods = _.filter(workPeriods, { [key]: value })
    })
    if (criteria.paymentStatus) {
      workPeriods = _.filter(workPeriods, wp => _.includes(criteria.paymentStatus, wp.paymentStatus))
    }
    workPeriods = _.sortBy(workPeriods, [criteria.sortBy])
    if (criteria.sortOrder === 'desc') {
      workPeriods = _.reverse(workPeriods)
    }
    const total = workPeriods.length
    if (!options.returnAll) {
      workPeriods = _.slice(workPeriods, (page - 1) * perPage, page * perPage)
    }
    return {
      total,
      page,
      perPage,
      result: workPeriods
    }
  } catch (err) {
    logger.logFullError(err, { component: 'WorkPeriodService', context: 'searchWorkPeriods' })
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
  fullyUpdateWorkPeriod,
  deleteWorkPeriod,
  searchWorkPeriods
}
