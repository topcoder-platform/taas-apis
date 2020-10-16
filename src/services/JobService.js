/**
 * This service provides operations of Job.
 */

const _ = require('lodash')
const Joi = require('joi')
const { Op } = require('sequelize')
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
  job.createdAt = new Date()
  job.createdBy = currentUser.userId
  job.status = 'sourcing'
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
  data.updatedBy = currentUser.userId
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
    criteria.sortBy = 'id'
  }
  if (!criteria.sortOrder) {
    criteria.sortOrder = 'desc'
  }
  const query = {
    order: [[criteria.sortBy, criteria.sortOrder]],
    include: [{ model: Job._models.JobCandidate, as: 'candidates', where: { deletedAt: null }, attributes: { exclude: ['deletedAt'] }, required: false }],
    where: _.assign({ deletedAt: null }, _.omit(criteria, ['perPage', 'page', 'sortBy', 'sortOrder', 'skill'])),
    attributes: {
      exclude: ['deletedAt']
    },
    limit: perPage,
    offset: (page - 1) * perPage
  }
  if (criteria.skill) {
    query.where.skills = {
      [Op.contains]: [criteria.skill]
    }
  }

  const result = await Job.findAndCountAll(query)

  logger.debug(`Query: ${JSON.stringify(query)}`)

  return {
    total: result.count,
    page,
    perPage,
    result: _.map(result.rows, (row) => {
      row.dataValues.candidates = _.map(row.dataValues.candidates, (c) => helper.clearObject(c.dataValues))
      return helper.clearObject(row.dataValues)
    })
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
