/**
 * This service provides operations of Job.
 */

const _ = require('lodash')
const Joi = require('joi')
const config = require('config')
const { v4: uuid } = require('uuid')
const helper = require('../common/helper')
const logger = require('../common/logger')
const errors = require('../common/errors')
const models = require('../models')

const Job = models.Job

/**
 * Get job by id
 * @param {String} id the job id
 * @returns {Object} the job
 */
async function getJob (id) {
  const job = await Job.findById(id, true)
  job.dataValues.candidates = _.map(job.dataValues.candidates, (c) => helper.clearObject(c.dataValues))
  return helper.clearObject(job.dataValues)
}

getJob.schema = Joi.object().keys({
  id: Joi.string().guid().required()
}).required()

/**
 * Create job
 * @params {Object} currentUser the user who perform this operation
 * @params {Object} job the job to be created
 * @returns {Object} the created job
 */
async function createJob (currentUser, job) {
  if (!currentUser.isBookingManager) {
    const connect = await helper.isConnectMember(job.projectId, currentUser.jwtToken)
    if (!connect) {
      throw new errors.ForbiddenError('You are not allowed to perform this action!')
    }
  }
  job.id = uuid()
  job.createdAt = new Date()
  job.createdBy = await helper.getUserId(currentUser.userId)
  job.status = 'sourcing'

  const esClient = helper.getESClient()
  await esClient.create({
    index: config.get('esConfig.ES_INDEX_JOB'),
    id: job.id,
    body: _.omit(job, 'id'),
    refresh: 'true' // refresh ES so that it is visible for read operations instantly
  })

  const created = await Job.create(job)
  return helper.clearObject(created.dataValues)
}

createJob.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  job: Joi.object().keys({
    projectId: Joi.number().integer().required(),
    externalId: Joi.string().required(),
    description: Joi.string().required(),
    startDate: Joi.date().required(),
    endDate: Joi.date().required(),
    numPositions: Joi.number().integer().min(1).required(),
    resourceType: Joi.string().required(),
    rateType: Joi.rateType(),
    skills: Joi.array().items(Joi.string().uuid()).required()
  }).required()
}).required()

/**
 * Update job
 * @params {Object} currentUser the user who perform this operation
 * @params {String} job id
 * @params {Object} data the data to be updated
 * @returns {Object} the updated job
 */
async function updateJob (currentUser, id, data) {
  let job = await Job.findById(id)
  if (!currentUser.isBookingManager) {
    const connect = await helper.isConnectMember(job.dataValues.projectId, currentUser.jwtToken)
    if (!connect) {
      throw new errors.ForbiddenError('You are not allowed to perform this action!')
    }
  }

  data.updatedAt = new Date()
  data.updatedBy = await helper.getUserId(currentUser.userId)

  const esClient = helper.getESClient()
  await esClient.update({
    index: config.get('esConfig.ES_INDEX_JOB'),
    id,
    body: {
      doc: data
    },
    refresh: 'true' // refresh ES so that it is visible for read operations instantly
  })

  await job.update(data)
  job = await Job.findById(id, true)
  job.dataValues.candidates = _.map(job.dataValues.candidates, (c) => helper.clearObject(c.dataValues))
  return helper.clearObject(job.dataValues)
}

/**
 * Partially update job by id
 * @params {Object} currentUser the user who perform this operation
 * @params {String} id the job id
 * @params {Object} data the data to be updated
 * @returns {Object} the updated job
 */
async function partiallyUpdateJob (currentUser, id, data) {
  return updateJob(currentUser, id, data, false)
}

partiallyUpdateJob.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  id: Joi.string().guid().required(),
  data: Joi.object().keys({
    status: Joi.jobStatus(),
    description: Joi.string(),
    startDate: Joi.date(),
    endDate: Joi.date(),
    numPositions: Joi.number().integer().min(1),
    resourceType: Joi.string(),
    rateType: Joi.rateType(),
    skills: Joi.array().items(Joi.string().uuid())
  }).required()
}).required()

/**
 * Fully update job by id
 * @params {Object} currentUser the user who perform this operation
 * @params {String} id the job id
 * @params {Object} data the data to be updated
 * @returns {Object} the updated job
 */
async function fullyUpdateJob (currentUser, id, data) {
  return updateJob(currentUser, id, data, true)
}

fullyUpdateJob.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  id: Joi.string().guid().required(),
  data: Joi.object().keys({
    projectId: Joi.number().integer().required(),
    externalId: Joi.string().required(),
    description: Joi.string().required(),
    startDate: Joi.date().required(),
    endDate: Joi.date().required(),
    numPositions: Joi.number().integer().min(1).required(),
    resourceType: Joi.string().required(),
    rateType: Joi.rateType().required(),
    skills: Joi.array().items(Joi.string().uuid()).required(),
    status: Joi.jobStatus()
  }).required()
}).required()

/**
 * Delete job by id
 * @params {Object} currentUser the user who perform this operation
 * @params {String} id the job id
 */
async function deleteJob (currentUser, id) {
  if (!currentUser.isBookingManager) {
    throw new errors.ForbiddenError('You are not allowed to perform this action!')
  }

  const esClient = helper.getESClient()
  await esClient.delete({
    index: config.get('esConfig.ES_INDEX_JOB'),
    id,
    refresh: 'true' // refresh ES so that it is visible for read operations instantly
  }, {
    ignore: [404]
  })
  const job = await Job.findById(id)
  await job.update({ deletedAt: new Date() })
}

deleteJob.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  id: Joi.string().guid().required()
}).required()

/**
 * List jobs
 * @params {Object} criteria the search criteria
 * @returns {Object} the search result, contain total/page/perPage and result array
 */
async function searchJobs (criteria) {
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
    index: config.get('esConfig.ES_INDEX_JOB'),
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

  _.each(_.pick(criteria, ['projectId', 'externalId', 'description', 'startDate', 'endDate', 'resourceType', 'skill', 'rateType', 'status']), (value, key) => {
    let must
    if (key === 'description') {
      must = {
        match: {
          [key]: {
            query: value
          }
        }
      }
    } else if (key === 'skill') {
      must = {
        terms: {
          skills: [value]
        }
      }
    } else {
      must = {
        term: {
          [key]: {
            value
          }
        }
      }
    }
    esQuery.body.query.bool.must.push(must)
  })
  logger.debug(`Query: ${JSON.stringify(esQuery)}`)

  const esClient = helper.getESClient()
  const { body } = await esClient.search(esQuery)
  const result = await Promise.all(_.map(body.hits.hits, async (hit) => {
    const jobRecord = _.cloneDeep(hit._source)
    jobRecord.id = hit._id

    const { body } = await esClient.search({
      index: config.get('esConfig.ES_INDEX_JOB_CANDIDATE'),
      body: {
        query: {
          term: {
            jobId: {
              value: jobRecord.id
            }
          }
        }
      }
    })

    if (body.hits.total.value > 0) {
      const candidates = _.map(body.hits.hits, (hit) => {
        const candidateRecord = _.cloneDeep(hit._source)
        candidateRecord.id = hit._id
        return candidateRecord
      })
      jobRecord.candidates = candidates
    }
    return jobRecord
  }))

  return {
    total: body.hits.total.value,
    page,
    perPage,
    result
  }
}

searchJobs.schema = Joi.object().keys({
  criteria: Joi.object().keys({
    page: Joi.number().integer(),
    perPage: Joi.number().integer(),
    sortBy: Joi.string().valid('id', 'createdAt', 'startDate', 'endDate', 'rateType', 'status'),
    sortOrder: Joi.string().valid('desc', 'asc'),
    projectId: Joi.number().integer(),
    externalId: Joi.string(),
    description: Joi.string(),
    startDate: Joi.date(),
    endDate: Joi.date(),
    resourceType: Joi.string(),
    skill: Joi.string().uuid(),
    rateType: Joi.rateType(),
    status: Joi.jobStatus()
  }).required()
}).required()

module.exports = {
  getJob,
  createJob,
  partiallyUpdateJob,
  fullyUpdateJob,
  deleteJob,
  searchJobs
}
