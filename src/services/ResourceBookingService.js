/**
 * This service provides operations of ResourceBooking.
 */

const _ = require('lodash')
const Joi = require('joi').extend(require('@joi/date'))
const config = require('config')
const HttpStatus = require('http-status-codes')
const { Op } = require('sequelize')
const { v4: uuid } = require('uuid')
const helper = require('../common/helper')
const logger = require('../common/logger')
const errors = require('../common/errors')
const models = require('../models')
const constants = require('../../app-constants')
const moment = require('moment')

const ResourceBooking = models.ResourceBooking
const WorkPeriod = models.WorkPeriod
const esClient = helper.getESClient()
const cachedModelFields = _cacheModelFields()

/**
 * Get the fields of the ResourceBooking model and the nested WorkPeriod model
 * @returns {Array<string>} array of field names
 */
function _cacheModelFields () {
  const resourceBookingFields = _.keys(ResourceBooking.rawAttributes)
  const workPeriodFields = _.map(_.keys(WorkPeriod.rawAttributes), key => `workPeriods.${key}`)
  return [...resourceBookingFields, 'workPeriods', ...workPeriodFields]
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
 * Evaluates the criterias and returns the fields
 * to be returned as a result of GET endpoints
 * @param {Object} currentUser the user who perform this operation.
 * @param {Object} criteria the query criterias
 * @returns {Object} result
 * @returns {Array<string>} result.include field names to include
 * @returns {Array<string>} result.fieldsRB ResourceBooking field names to include
 * @returns {Array<string>} result.fieldsWP WorkPeriod field names to include
 * @returns {Array<string>} result.excludeRB ResourceBooking field names to exclude
 * @returns {Array<string>} result.excludeWP WorkPeriod field names to exclude
 * @returns {Boolean} result.regularUser is current user a regular user?
 * @returns {Boolean} result.allWorkPeriods will all WorkPeriod fields be returned?
 * @returns {Boolean} result.withWorkPeriods does fields include any WorkPeriod field?
 * @returns {Boolean} result.sortByWP will the sorting be done by WorkPeriod field?
 */
function _checkCriteriaAndGetFields (currentUser, criteria) {
  const result = {
    include: [],
    fieldsRB: [],
    fieldsWP: [],
    excludeRB: [],
    excludeWP: []
  }
  const fields = criteria.fields
  const sort = criteria.sortBy
  const onlyResourceBooking = _.isUndefined(fields)
  const query = onlyResourceBooking ? [] : _.split(fields, ',')
  const notAllowedFields = _.difference(query, cachedModelFields)
  // Check if fields criteria has a field name that RB or WP models don't have
  if (notAllowedFields.length > 0) {
    throw new errors.BadRequestError(`${notAllowedFields} are not allowed`)
  }
  // Check if user is a regular user. Regular users can't get ResourceBookings for which they are not a member
  result.regularUser = !currentUser.hasManagePermission && !currentUser.isMachine && !currentUser.isConnectManager
  // Check if all WorkPeriod fields will be returned
  result.allWorkPeriods = _.some(query, q => q === 'workPeriods')
  // Split the fields criteria into ResourceBooking and WorkPeriod fields
  _.forEach(query, q => {
    if (_.includes(q, '.')) { result.fieldsWP.push(q) } else if (q !== 'workPeriods') { result.fieldsRB.push(q) }
  })
  // Check if any WorkPeriod field will be returned
  result.withWorkPeriods = result.allWorkPeriods || result.fieldsWP.length > 0
  // Extract the filters from criteria parameter
  let filters = _.filter(Object.keys(criteria), key => _.indexOf(['fromDb', 'fields', 'page', 'perPage', 'sortBy', 'sortOrder'], key) === -1)
  filters = _.map(filters, f => {
    if (f === 'projectIds') {
      return 'projectId'
    } return f
  })
  const filterRB = []
  const filterWP = []
  // Split the filters criteria into ResourceBooking and WorkPeriod filters
  _.forEach(filters, q => { if (_.includes(q, '.')) { filterWP.push(q) } else { filterRB.push(q) } })
  // Check if filter criteria has any WorkPeriod filter
  const filterHasWorkPeriods = filterWP.length > 0
  // Check if sorting will be done by WorkPeriod field
  result.sortByWP = _.split(sort, '.')[0] === 'workPeriods'
  // Check if the current user has the right to see the memberRate
  const canSeeMemberRate = currentUser.hasManagePermission || currentUser.isMachine
  // If current user has no right to see the memberRate then it's excluded
  // "currentUser.isMachine" to be true is not enough to return "workPeriods.memberRate"
  // but returning "workPeriod" will be evaluated later
  if (!canSeeMemberRate) {
    result.excludeRB.push('memberRate')
    result.excludeWP.push('workPeriods.memberRate')
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
    throw new errors.BadRequestError('Can not filter or sort by some field which is not included in fields')
  }
  // Check If it's tried to filter or sort by some field which should not be included as per rules of fields param
  if (!result.allWorkPeriods && _.difference(filterWP, result.fieldsWP).length > 0) {
    throw new errors.BadRequestError('Can not filter or sort by some field which is not included in fields')
  }
  // Check if the current user has no right to see the memberRate and memberRate is included in fields parameter
  if (!canSeeMemberRate && _.some(query, q => _.includes(['memberRate', 'workPeriods.memberRate'], q))) {
    throw new errors.ForbiddenError('You don\'t have access to view memberRate')
  }
  // Check if the current user has no right to see the workPeriods and workPeriods is included in fields parameter
  if (currentUser.isMachine && result.withWorkPeriods && !_checkUserScopesForGetWorkPeriods(currentUser)) {
    throw new errors.ForbiddenError('You don\'t have access to view workPeriods')
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
    const paidWorkPeriods = _.filter(workPeriods
      , workPeriod => _.includes(['completed', 'partially-completed'], workPeriod.paymentStatus))
    if (paidWorkPeriods.length > 0) {
      throw new errors.BadRequestError(`WorkPeriods with id of ${_.map(paidWorkPeriods, workPeriod => workPeriod.id)}
        has completed or partially-completed payment status.`)
    }
  }
  // find related workPeriods to evaluate the changes
  const workPeriods = await WorkPeriod.findAll({
    where: {
      resourceBookingId: resourceBookingId
    },
    raw: true
  })
  // oldValue and newValue are not provided at deleteResourceBooking process
  if (_.isUndefined(oldValue) || _.isUndefined(newValue)) {
    _checkForPaidWorkPeriods(workPeriods)
    return
  }
  // We should not be able to change status of ResourceBooking to 'cancelled'
  // if there is at least one associated Work Period with paymentStatus 'partially-completed' or 'completed'.
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
  // we can't delete workperiods with paymentStatus 'partially-completed' or 'completed'.
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
  if (!criteria.fromDb) {
    try {
      const resourceBooking = await esClient.get({
        index: config.esConfig.ES_INDEX_RESOURCE_BOOKING,
        id,
        _source_includes: [...queryOpt.include],
        _source_excludes: ['workPeriods.payments', ...queryOpt.excludeRB, ...queryOpt.excludeWP]
      })
      if (queryOpt.regularUser) {
        await _checkUserPermissionForGetResourceBooking(currentUser, resourceBooking.body._source.projectId) // check user permission
      }
      return resourceBooking.body._source
    } catch (err) {
      if (helper.isDocumentMissingException(err)) {
        throw new errors.NotFoundError(`id: ${id} "ResourceBooking" not found`)
      }
      if (err.httpStatus === HttpStatus.UNAUTHORIZED) {
        throw err
      }
      logger.logFullError(err, { component: 'ResourceBookingService', context: 'getResourceBooking' })
    }
  }
  logger.info({ component: 'ResourceBookingService', context: 'getResourceBooking', message: 'try to query db for data' })
  const resourceBooking = await ResourceBooking.findById(id, queryOpt)
  if (queryOpt.regularUser) {
    await _checkUserPermissionForGetResourceBooking(currentUser, resourceBooking.projectId) // check user permission
  }
  return resourceBooking.dataValues
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
  await helper.ensureUserById(resourceBooking.userId) // ensure user exists

  resourceBooking.id = uuid()
  resourceBooking.createdBy = await helper.getUserId(currentUser.userId)

  const created = await ResourceBooking.create(resourceBooking)
  await helper.postEvent(config.TAAS_RESOURCE_BOOKING_CREATE_TOPIC, created.toJSON())
  return created.dataValues
}

createResourceBooking.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  resourceBooking: Joi.object().keys({
    status: Joi.resourceBookingStatus().default('placed'),
    projectId: Joi.number().integer().required(),
    userId: Joi.string().uuid().required(),
    jobId: Joi.string().uuid().allow(null),
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
  // before updating the record, we need to check if any paid work periods tried to be deleted
  await _ensurePaidWorkPeriodsNotDeleted(id, oldValue, data)

  data.updatedBy = await helper.getUserId(currentUser.userId)

  const updated = await resourceBooking.update(data)
  await helper.postEvent(config.TAAS_RESOURCE_BOOKING_UPDATE_TOPIC, updated.toJSON(), { oldValue: oldValue })
  return updated.dataValues
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
  await helper.ensureUserById(data.userId) // ensure user exists
  return updateResourceBooking(currentUser, id, data)
}

fullyUpdateResourceBooking.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  id: Joi.string().uuid().required(),
  data: Joi.object().keys({
    projectId: Joi.number().integer().required(),
    userId: Joi.string().uuid().required(),
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
  await resourceBooking.destroy()
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
async function searchResourceBookings (currentUser, criteria, options = { returnAll: false }) {
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
  try {
    const esQuery = {
      index: config.get('esConfig.ES_INDEX_RESOURCE_BOOKING'),
      _source_includes: queryOpt.include,
      _source_excludes: ['workPeriods.payments', ...queryOpt.excludeRB, ...queryOpt.excludeWP],
      body: {
        query: {
          bool: {
            must: []
          }
        },
        from: (page - 1) * perPage,
        size: perPage
      }
    }
    if (!queryOpt.sortByWP) {
      esQuery.body.sort = [{ [criteria.sortBy === 'id' ? '_id' : criteria.sortBy]: { order: criteria.sortOrder } }]
    }
    // change the date format to match with index schema
    if (criteria.startDate) {
      criteria.startDate = moment(criteria.startDate).format('YYYY-MM-DD')
    }
    if (criteria.endDate) {
      criteria.endDate = moment(criteria.endDate).format('YYYY-MM-DD')
    }
    if (criteria['workPeriods.startDate']) {
      criteria['workPeriods.startDate'] = moment(criteria['workPeriods.startDate']).format('YYYY-MM-DD')
    }
    if (criteria['workPeriods.endDate']) {
      criteria['workPeriods.endDate'] = moment(criteria['workPeriods.endDate']).format('YYYY-MM-DD')
    }
    // Apply ResourceBooking filters
    _.each(_.pick(criteria, ['status', 'startDate', 'endDate', 'rateType', 'projectId', 'jobId', 'userId']), (value, key) => {
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
    // Apply WorkPeriod filters
    const workPeriodFilters = ['workPeriods.paymentStatus', 'workPeriods.startDate', 'workPeriods.endDate', 'workPeriods.userHandle']
    if (_.intersection(criteria, workPeriodFilters).length > 0) {
      const workPeriodsMust = []
      _.each(_.pick(criteria, workPeriodFilters), (value, key) => {
        workPeriodsMust.push({
          term: {
            [key]: {
              value
            }
          }
        })
      })

      esQuery.body.query.bool.must.push({
        nested: {
          path: 'workPeriods',
          query: { bool: { must: workPeriodsMust } }
        }
      })
    }
    logger.debug({ component: 'ResourceBookingService', context: 'searchResourceBookings', message: `Query: ${JSON.stringify(esQuery)}` })

    const { body } = await esClient.search(esQuery)
    let resourceBookings = _.map(body.hits.hits, '_source')
    // ESClient will return ResourceBookings with it's all nested WorkPeriods
    // We re-apply WorkPeriod filters
    _.each(_.pick(criteria, workPeriodFilters), (value, key) => {
      key = key.split('.')[1]
      _.each(resourceBookings, r => {
        r.workPeriods = _.filter(r.workPeriods, { [key]: value })
      })
    })
    // If sorting criteria is WorkPeriod field, we have to sort manually
    if (queryOpt.sortByWP) {
      const sorts = criteria.sortBy.split('.')
      resourceBookings = _.sortBy(resourceBookings, [`${sorts[0]}[0].${sorts[1]}`])
      if (criteria.sortOrder === 'desc') {
        resourceBookings = _.reverse(resourceBookings)
      }
    }
    return {
      total: body.hits.total.value,
      page,
      perPage,
      result: resourceBookings
    }
  } catch (err) {
    logger.logFullError(err, { component: 'ResourceBookingService', context: 'searchResourceBookings' })
  }
  logger.info({ component: 'ResourceBookingService', context: 'searchResourceBookings', message: 'fallback to DB query' })
  const filter = { [Op.and]: [] }
  // Apply ResourceBooking filters
  _.each(_.pick(criteria, ['status', 'startDate', 'endDate', 'rateType', 'projectId', 'jobId', 'userId']), (value, key) => {
    filter[Op.and].push({ [key]: value })
  })
  if (criteria.projectIds) {
    filter[Op.and].push({ projectId: criteria.projectIds })
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
      queryCriteria.include[0].attributes = _.map(queryOpt.fieldsWP, f => _.split(f, '.')[1])
    } else if (queryOpt.excludeWP && queryOpt.excludeWP.length > 0) {
      queryCriteria.include[0].attributes = { exclude: _.map(queryOpt.excludeWP, f => _.split(f, '.')[1]) }
    }
    // Apply WorkPeriod filters
    _.each(_.pick(criteria, ['workPeriods.startDate', 'workPeriods.endDate', 'workPeriods.userHandle', 'workPeriods.paymentStatus']), (value, key) => {
      key = key.split('.')[1]
      queryCriteria.include[0].where[Op.and].push({ [key]: value })
      queryCriteria.include[0].required = true
    })
  }
  // Apply sorting criteria
  if (!queryOpt.sortByWP) {
    queryCriteria.order = [[criteria.sortBy, criteria.sortOrder]]
  } else {
    queryCriteria.order = [[{ model: WorkPeriod, as: 'workPeriods' }, _.split(criteria.sortBy, '.')[1], criteria.sortOrder]]
  }
  const resourceBookings = await ResourceBooking.findAll(queryCriteria)
  const total = await ResourceBooking.count(_.omit(queryCriteria, ['limit', 'offset', 'attributes', 'order']))
  return {
    fromDb: true,
    total,
    page,
    perPage,
    result: resourceBookings
  }
}

searchResourceBookings.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  criteria: Joi.object().keys({
    fields: Joi.string(),
    page: Joi.page(),
    perPage: Joi.perPage(),
    sortBy: Joi.string().valid('id', 'rateType', 'startDate', 'endDate', 'customerRate', 'memberRate', 'status',
      'workPeriods.userHandle', 'workPeriods.daysWorked', 'workPeriods.customerRate', 'workPeriods.memberRate', 'workPeriods.paymentStatus'),
    sortOrder: Joi.string().valid('desc', 'asc'),
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
    'workPeriods.paymentStatus': Joi.paymentStatus(),
    'workPeriods.startDate': Joi.date().format('YYYY-MM-DD'),
    'workPeriods.endDate': Joi.date().format('YYYY-MM-DD'),
    'workPeriods.userHandle': Joi.string()
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
