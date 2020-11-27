/**
 * This service provides operations of Job.
 */

const _ = require('lodash')
const Joi = require('joi')
const HttpStatus = require('http-status-codes')
const config = require('config')
const { Op } = require('sequelize')
const { v4: uuid } = require('uuid')
const helper = require('../common/helper')
const logger = require('../common/logger')
const errors = require('../common/errors')
const models = require('../models')

const Job = models.Job
const esClient = helper.getESClient()

/**
 * populate candidates for a job.
 *
 * @param {String} jobId the job id
 * @returns {Array} the list of candidates
 */
async function _getJobCandidates (jobId) {
  const { body } = await esClient.search({
    index: config.get('esConfig.ES_INDEX_JOB_CANDIDATE'),
    body: {
      query: {
        term: {
          jobId: {
            value: jobId
          }
        }
      }
    }
  })

  if (body.hits.total.value === 0) {
    return []
  }
  const candidates = _.map(body.hits.hits, (hit) => {
    const candidateRecord = _.cloneDeep(hit._source)
    candidateRecord.id = hit._id
    return candidateRecord
  })
  return candidates
}

/**
 * Validate if all skills exist.
 *
 * @param {Array} skills the list of skills
 * @returns {undefined}
 */
async function _validateSkills (skills) {
  const m2mToken = await helper.getM2Mtoken()
  const responses = await Promise.all(
    skills.map(
      skill => helper.getSkillById(`Bearer ${m2mToken}`, skill)
        .then(() => {
          return { found: true }
        })
        .catch(err => {
          if (err.status !== HttpStatus.NOT_FOUND) {
            throw err
          }
          return { found: false, skill }
        })
    )
  )
  const errResponses = responses.filter(res => !res.found)
  if (errResponses.length) {
    throw new errors.BadRequestError(`Invalid skills: [${errResponses.map(res => res.skill)}]`)
  }
}

/**
 * Get job by id
 * @param {String} id the job id
 * @param {Boolean} fromDb flag if query db for data or not
 * @returns {Object} the job
 */
async function getJob (id, fromDb = false) {
  if (!fromDb) {
    try {
      const job = await esClient.get({
        index: config.esConfig.ES_INDEX_JOB,
        id
      })
      const jobId = job.body._id
      const jobRecord = { id: jobId, ...job.body._source }
      const candidates = await _getJobCandidates(jobId)
      if (candidates.length) {
        jobRecord.candidates = candidates
      }
      return jobRecord
    } catch (err) {
      if (helper.isDocumentMissingException(err)) {
        throw new errors.NotFoundError(`id: ${id} "Job" not found`)
      }
      logger.logFullError(err, { component: 'JobService', context: 'getJob' })
    }
  }
  logger.info({ component: 'JobService', context: 'getJob', message: 'try to query db for data' })
  const job = await Job.findById(id, true)
  job.dataValues.candidates = _.map(job.dataValues.candidates, (c) => helper.clearObject(c.dataValues))
  return helper.clearObject(job.dataValues)
}

getJob.schema = Joi.object().keys({
  id: Joi.string().guid().required(),
  fromDb: Joi.boolean()
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
  await _validateSkills(job.skills)
  job.id = uuid()
  job.createdAt = new Date()
  job.createdBy = await helper.getUserId(currentUser.userId)
  job.status = 'sourcing'

  const created = await Job.create(job)
  await helper.postEvent(config.TAAS_JOB_CREATE_TOPIC, job)
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
  if (data.skills) {
    await _validateSkills(data.skills)
  }

  data.updatedAt = new Date()
  data.updatedBy = await helper.getUserId(currentUser.userId)

  await job.update(data)
  await helper.postEvent(config.TAAS_JOB_UPDATE_TOPIC, { id, ...data })
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

  const job = await Job.findById(id)
  await job.update({ deletedAt: new Date() })
  await helper.postEvent(config.TAAS_JOB_DELETE_TOPIC, { id })
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
    criteria.sortBy = 'id'
  }
  if (!criteria.sortOrder) {
    criteria.sortOrder = 'desc'
  }
  try {
    const sort = [{ [criteria.sortBy === 'id' ? '_id' : criteria.sortBy]: { order: criteria.sortOrder } }]

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
    // If criteria contains projectIds, filter projectId with this value
    if (criteria.projectIds) {
      esQuery.body.query.bool.filter = [{
        terms: {
          projectId: criteria.projectIds
        }
      }]
    }
    logger.debug({ component: 'JobService', context: 'searchJobs', message: `Query: ${JSON.stringify(esQuery)}` })

    const { body } = await esClient.search(esQuery)
    const result = await Promise.all(_.map(body.hits.hits, async (hit) => {
      const jobRecord = _.cloneDeep(hit._source)
      jobRecord.id = hit._id
      const candidates = await _getJobCandidates(jobRecord.id)
      if (candidates.length) {
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
  } catch (err) {
    logger.logFullError(err, { component: 'JobService', context: 'searchJobs' })
  }
  logger.info({ component: 'JobService', context: 'searchJobs', message: 'fallback to DB query' })
  const filter = {
    [Op.and]: [{ deletedAt: null }]
  }
  _.each(_.pick(criteria, ['projectId', 'externalId', 'startDate', 'endDate', 'resourceType', 'rateType', 'status']), (value, key) => {
    filter[Op.and].push({ [key]: value })
  })
  if (criteria.description) {
    filter.description = {
      [Op.like]: `%${criteria.description}%`
    }
  }
  if (criteria.skills) {
    filter.skills = {
      [Op.contains]: [criteria.skills]
    }
  }
  const jobs = await Job.findAll({
    where: filter,
    attributes: {
      exclude: ['deletedAt']
    },
    offset: ((page - 1) * perPage),
    limit: perPage,
    order: [[criteria.sortBy, criteria.sortOrder]],
    include: [{
      model: models.JobCandidate,
      as: 'candidates',
      where: {
        deletedAt: null
      },
      required: false,
      attributes: {
        exclude: ['deletedAt']
      }
    }]
  })
  return {
    fromDb: true,
    total: jobs.length,
    page,
    perPage,
    result: _.map(jobs, job => helper.clearObject(job.dataValues))
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
    status: Joi.jobStatus(),
    projectIds: Joi.array().items(Joi.number().integer()).single()
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
