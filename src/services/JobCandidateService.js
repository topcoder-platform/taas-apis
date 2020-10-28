/**
 * This service provides operations of JobCandidate.
 */

const _ = require('lodash')
const Joi = require('joi')
const config = require('config')
const { v4: uuid } = require('uuid')
const helper = require('../common/helper')
const logger = require('../common/logger')
const errors = require('../common/errors')
const models = require('../models')

const JobCandidate = models.JobCandidate

/**
 * Get jobCandidate by id
 * @param {String} id the jobCandidate id
 * @returns {Object} the jobCandidate
 */
async function getJobCandidate (id) {
  const jobCandidate = await JobCandidate.findById(id)
  return helper.clearObject(jobCandidate.dataValues)
}

getJobCandidate.schema = Joi.object().keys({
  id: Joi.string().guid().required()
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

  const esClient = helper.getESClient()
  await esClient.create({
    index: config.get('esConfig.ES_INDEX_JOB_CANDIDATE'),
    id: jobCandidate.id,
    body: _.omit(jobCandidate, 'id'),
    refresh: 'true' // refresh ES so that it is visible for read operations instantly
  })

  const created = await JobCandidate.create(jobCandidate)
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
  if (projectId && !currentUser.isBookingManager) {
    const connect = await helper.isConnectMember(projectId, currentUser.jwtToken)
    if (!connect) {
      if (jobCandidate.dataValues.userId !== await helper.getUserId(currentUser.userId)) {
        throw new errors.ForbiddenError('You are not allowed to perform this action!')
      }
    }
  }
  data.updatedAt = new Date()
  data.updatedBy = await helper.getUserId(currentUser.userId)

  const esClient = helper.getESClient()
  await esClient.update({
    index: config.get('esConfig.ES_INDEX_JOB_CANDIDATE'),
    id,
    body: {
      doc: data
    },
    refresh: 'true' // refresh ES so that it is visible for read operations instantly
  })

  await jobCandidate.update(data)
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
  if (!currentUser.isBookingManager) {
    throw new errors.ForbiddenError('You are not allowed to perform this action!')
  }

  const esClient = helper.getESClient()
  await esClient.delete({
    index: config.get('esConfig.ES_INDEX_JOB_CANDIDATE'),
    id,
    refresh: 'true' // refresh ES so that it is visible for read operations instantly
  }, {
    ignore: [404]
  })

  const jobCandidate = await JobCandidate.findById(id)
  await jobCandidate.update({ deletedAt: new Date() })
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
