/**
 * This service provides operations of JobCandidate.
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
const JobService = require('./JobService')

const JobCandidate = models.JobCandidate
const esClient = helper.getESClient()

/**
 * Check user permission for getting job candidate.
 *
 * @param {Object} currentUser the user who perform this operation.
 * @param {String} jobId the job id
 * @returns {undefined}
 */
async function _checkUserPermissionForGetJobCandidate (currentUser, jobId) {
  if (!currentUser.hasManagePermission && !currentUser.isMachine && !currentUser.isConnectManager) {
    const job = await models.Job.findById(jobId)
    await helper.checkIsMemberOfProject(currentUser.userId, job.projectId)
  }
}

/**
 * Get jobCandidate by id
 * @param {Object} currentUser the user who perform this operation.
 * @param {String} id the jobCandidate id
 * @param {Boolean} fromDb flag if query db for data or not
 * @returns {Object} the jobCandidate
 */
async function getJobCandidate (currentUser, id, fromDb = false) {
  if (!fromDb) {
    try {
      const jobCandidate = await esClient.get({
        index: config.esConfig.ES_INDEX_JOB_CANDIDATE,
        id
      })

      await _checkUserPermissionForGetJobCandidate(currentUser, jobCandidate.body._source.jobId) // check user permisson

      const jobCandidateRecord = { id: jobCandidate.body._id, ...jobCandidate.body._source }
      return jobCandidateRecord
    } catch (err) {
      if (helper.isDocumentMissingException(err)) {
        throw new errors.NotFoundError(`id: ${id} "JobCandidate" not found`)
      }
      if (err.httpStatus === HttpStatus.FORBIDDEN) {
        throw err
      }
      logger.logFullError(err, { component: 'JobCandidateService', context: 'getJobCandidate' })
    }
  }
  logger.info({ component: 'JobCandidateService', context: 'getJobCandidate', message: 'try to query db for data' })
  const jobCandidate = await JobCandidate.findById(id)

  await _checkUserPermissionForGetJobCandidate(currentUser, jobCandidate.jobId) // check user permission

  return jobCandidate.dataValues
}

getJobCandidate.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  id: Joi.string().guid().required(),
  fromDb: Joi.boolean()
}).required()

/**
 * Create jobCandidate
 * @params {Object} currentUser the user who perform this operation
 * @params {Object} jobCandidate the jobCandidate to be created
 * @returns {Object} the created jobCandidate
 */
async function createJobCandidate (currentUser, jobCandidate) {
  // check user permission
  if (!currentUser.hasManagePermission && !currentUser.isMachine) {
    throw new errors.ForbiddenError('You are not allowed to perform this action!')
  }

  await helper.ensureJobById(jobCandidate.jobId) // ensure job exists
  await helper.ensureUserById(jobCandidate.userId) // ensure user exists

  jobCandidate.id = uuid()
  jobCandidate.createdAt = new Date()
  jobCandidate.createdBy = await helper.getUserId(currentUser.userId)

  const created = await JobCandidate.create(jobCandidate)
  await helper.postEvent(config.TAAS_JOB_CANDIDATE_CREATE_TOPIC, created.toJSON())
  return created.dataValues
}

createJobCandidate.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  jobCandidate: Joi.object().keys({
    status: Joi.jobCandidateStatus().default('open'),
    jobId: Joi.string().uuid().required(),
    userId: Joi.string().uuid().required(),
    externalId: Joi.string(),
    resume: Joi.string().uri()
  }).required()
}).required()

/**
 * Update jobCandidate
 * @params {Object} currentUser the user who perform this operation
 * @params {String} id the jobCandidate id
 * @params {Object} data the data to be updated
 * @returns {Object} the updated jobCandidate
 */
async function updateJobCandidate (currentUser, id, data) {
  const jobCandidate = await JobCandidate.findById(id)
  const userId = await helper.getUserId(currentUser.userId)

  // check user permission
  if (!currentUser.hasManagePermission && !currentUser.isMachine) {
    const job = await models.Job.findById(jobCandidate.jobId)
    await helper.checkIsMemberOfProject(currentUser.userId, job.projectId)
  }

  data.updatedAt = new Date()
  data.updatedBy = userId

  const updated = await jobCandidate.update(data)
  await helper.postEvent(config.TAAS_JOB_CANDIDATE_UPDATE_TOPIC, updated.toJSON())
  const result = _.assign(jobCandidate.dataValues, data)
  return result
}

/**
 * Partially update jobCandidate by id
 * @params {Object} currentUser the user who perform this operation
 * @params {String} id the jobCandidate id
 * @params {Object} data the data to be updated
 * @returns {Object} the updated jobCandidate
 */
async function partiallyUpdateJobCandidate (currentUser, id, data) {
  return updateJobCandidate(currentUser, id, data)
}

partiallyUpdateJobCandidate.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  id: Joi.string().uuid().required(),
  data: Joi.object().keys({
    status: Joi.jobCandidateStatus(),
    externalId: Joi.string(),
    resume: Joi.string().uri()
  }).required()
}).required()

/**
 * Fully update jobCandidate by id
 * @params {Object} currentUser the user who perform this operation
 * @params {String} id the jobCandidate id
 * @params {Object} data the data to be updated
 * @returns {Object} the updated jobCandidate
 */
async function fullyUpdateJobCandidate (currentUser, id, data) {
  await helper.ensureJobById(data.jobId) // ensure job exists
  await helper.ensureUserById(data.userId) // ensure user exists
  return updateJobCandidate(currentUser, id, data)
}

fullyUpdateJobCandidate.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  id: Joi.string().uuid().required(),
  data: Joi.object().keys({
    jobId: Joi.string().uuid().required(),
    userId: Joi.string().uuid().required(),
    status: Joi.jobCandidateStatus(),
    externalId: Joi.string(),
    resume: Joi.string().uri()
  }).required()
}).required()

/**
 * Delete jobCandidate by id
 * @params {Object} currentUser the user who perform this operation
 * @params {String} id the jobCandidate id
 */
async function deleteJobCandidate (currentUser, id) {
  // check user permission
  if (!currentUser.hasManagePermission && !currentUser.isMachine) {
    throw new errors.ForbiddenError('You are not allowed to perform this action!')
  }

  const jobCandidate = await JobCandidate.findById(id)
  await jobCandidate.update({ deletedAt: new Date() })
  await helper.postEvent(config.TAAS_JOB_CANDIDATE_DELETE_TOPIC, { id })
}

deleteJobCandidate.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  id: Joi.string().uuid().required()
}).required()

/**
 * List resourceBookings
 * @param {Object} currentUser the user who perform this operation.
 * @params {Object} criteria the search criteria
 * @returns {Object} the search result, contain total/page/perPage and result array
 */
async function searchJobCandidates (currentUser, criteria) {
  // check user permission
  if (!currentUser.hasManagePermission && !currentUser.isMachine && !currentUser.isConnectManager) {
    if (!criteria.jobId) { // regular user can only search with filtering by "jobId"
      throw new errors.ForbiddenError('Not allowed without filtering by "jobId"')
    }
    await JobService.getJob(currentUser, criteria.jobId) // check whether user can access the job associated with the jobCandidate
  }

  const page = criteria.page > 0 ? criteria.page : 1
  const perPage = criteria.perPage > 0 ? criteria.perPage : 20
  if (!criteria.sortBy) {
    criteria.sortBy = 'id'
  }
  if (!criteria.sortOrder) {
    criteria.sortOrder = 'desc'
  }
  try {
    const sort = [{ [criteria.sortBy === 'id' ? '_id' : criteria.sortBy]: { order: criteria.sortOrder } }]

    const esQuery = {
      index: config.get('esConfig.ES_INDEX_JOB_CANDIDATE'),
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

    _.each(_.pick(criteria, ['jobId', 'userId', 'status', 'externalId']), (value, key) => {
      esQuery.body.query.bool.must.push({
        term: {
          [key]: {
            value
          }
        }
      })
    })
    logger.debug({ component: 'JobCandidateService', context: 'searchJobCandidates', message: `Query: ${JSON.stringify(esQuery)}` })

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
    logger.logFullError(err, { component: 'JobCandidateService', context: 'searchJobCandidates' })
  }
  logger.info({ component: 'JobCandidateService', context: 'searchJobCandidates', message: 'fallback to DB query' })
  const filter = {
    [Op.and]: [{ deletedAt: null }]
  }
  _.each(_.pick(criteria, ['jobId', 'userId', 'status', 'externalId']), (value, key) => {
    filter[Op.and].push({ [key]: value })
  })
  const jobCandidates = await JobCandidate.findAll({
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
    total: jobCandidates.length,
    page,
    perPage,
    result: _.map(jobCandidates, jobCandidate => jobCandidate.dataValues)
  }
}

searchJobCandidates.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  criteria: Joi.object().keys({
    page: Joi.number().integer(),
    perPage: Joi.number().integer(),
    sortBy: Joi.string().valid('id', 'status'),
    sortOrder: Joi.string().valid('desc', 'asc'),
    jobId: Joi.string().uuid(),
    userId: Joi.string().uuid(),
    status: Joi.jobCandidateStatus(),
    externalId: Joi.string()
  }).required()
}).required()

module.exports = {
  getJobCandidate,
  createJobCandidate,
  partiallyUpdateJobCandidate,
  fullyUpdateJobCandidate,
  deleteJobCandidate,
  searchJobCandidates
}
