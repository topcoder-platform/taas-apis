/**
 * This service provides operations of JobCandidate.
 */

const _ = require('lodash')
const Joi = require('joi')
const config = require('config')
const { Op } = require('sequelize')
const { v4: uuid } = require('uuid')
const helper = require('../common/helper')
const logger = require('../common/logger')
const errors = require('../common/errors')
const models = require('../models')

const JobCandidate = models.JobCandidate
const esClient = helper.getESClient()

/**
 * Get jobCandidate by id
 * @param {String} id the jobCandidate id
 * @param {Boolean} fromDb flag if query db for data or not
 * @returns {Object} the jobCandidate
 */
async function getJobCandidate (id, fromDb = false) {
  if (!fromDb) {
    try {
      const jobCandidate = await esClient.get({
        index: config.esConfig.ES_INDEX_JOB_CANDIDATE,
        id
      })
      const jobCandidateRecord = { id: jobCandidate.body._id, ...jobCandidate.body._source }
      return jobCandidateRecord
    } catch (err) {
      if (helper.isDocumentMissingException(err)) {
        throw new errors.NotFoundError(`id: ${id} "JobCandidate" not found`)
      }
      logger.logFullError(err, { component: 'JobCandidateService', context: 'getJobCandidate' })
    }
  }
  logger.info({ component: 'JobCandidateService', context: 'getJobCandidate', message: 'try to query db for data' })
  const jobCandidate = await JobCandidate.findById(id)
  return helper.clearObject(jobCandidate.dataValues)
}

getJobCandidate.schema = Joi.object().keys({
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
  jobCandidate.id = uuid()
  jobCandidate.createdAt = new Date()
  jobCandidate.createdBy = await helper.getUserId(currentUser.userId)
  jobCandidate.status = 'open'

  const created = await JobCandidate.create(jobCandidate)
  await helper.postEvent(config.TAAS_JOB_CANDIDATE_CREATE_TOPIC, jobCandidate)
  return helper.clearObject(created.dataValues)
}

createJobCandidate.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  jobCandidate: Joi.object().keys({
    jobId: Joi.string().uuid().required(),
    userId: Joi.string().uuid().required()
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
  const projectId = await JobCandidate.getProjectId(jobCandidate.dataValues.jobId)
  const userId = await helper.getUserId(currentUser.userId)
  if (projectId && !currentUser.isBookingManager && !currentUser.isMachine) {
    const connect = await helper.isConnectMember(projectId, currentUser.jwtToken)
    if (!connect) {
      if (jobCandidate.dataValues.userId !== userId) {
        throw new errors.ForbiddenError('You are not allowed to perform this action!')
      }
    }
  }
  data.updatedAt = new Date()
  data.updatedBy = userId

  await jobCandidate.update(data)
  await helper.postEvent(config.TAAS_JOB_CANDIDATE_UPDATE_TOPIC, { id, ...data })
  const result = helper.clearObject(_.assign(jobCandidate.dataValues, data))
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
    status: Joi.jobCandidateStatus()
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
  return updateJobCandidate(currentUser, id, data)
}

fullyUpdateJobCandidate.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  id: Joi.string().uuid().required(),
  data: Joi.object().keys({
    jobId: Joi.string().uuid().required(),
    userId: Joi.string().uuid().required(),
    status: Joi.jobCandidateStatus()
  }).required()
}).required()

/**
 * Delete jobCandidate by id
 * @params {Object} currentUser the user who perform this operation
 * @params {String} id the jobCandidate id
 */
async function deleteJobCandidate (currentUser, id) {
  if (!currentUser.isBookingManager && !currentUser.isMachine) {
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
 * @params {Object} criteria the search criteria
 * @returns {Object} the search result, contain total/page/perPage and result array
 */
async function searchJobCandidates (criteria) {
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

    _.each(_.pick(criteria, ['jobId', 'userId', 'status']), (value, key) => {
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
  _.each(_.pick(criteria, ['jobId', 'userId', 'status']), (value, key) => {
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
    result: _.map(jobCandidates, jobCandidate => helper.clearObject(jobCandidate.dataValues))
  }
}

searchJobCandidates.schema = Joi.object().keys({
  criteria: Joi.object().keys({
    page: Joi.number().integer(),
    perPage: Joi.number().integer(),
    sortBy: Joi.string().valid('id', 'status'),
    sortOrder: Joi.string().valid('desc', 'asc'),
    jobId: Joi.string().uuid(),
    userId: Joi.string().uuid(),
    status: Joi.jobCandidateStatus()
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
