/**
 * This service provides operations of Job.
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

const sequelize = models.sequelize
const Job = models.Job

/**
 * Validate if all skills exist.
 *
 * @param {Array} skills the list of skills
 * @returns {undefined}
 */
async function _validateSkills (skills) {
  const responses = await Promise.all(
    skills.map(
      skill => helper.getSkillById(skill.skillId)
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
 * Validate by exact match on name field if all skills exist.
 *
 * @param {Array} skillNames the list of skill names to validate
 * @returns {Array} the list of matching skill objects
 */
async function _validateAndGetSkillsByNames (skillNames) {
  const skills = await helper.getSkillsByExactNames(skillNames)

  if (skills.length !== skillNames.length) {
    const foundSkillNames = skills.map(skill => skill.name)
    const notFoundSkillNames = _.difference(skillNames, foundSkillNames)
    throw new errors.BadRequestError(`Invalid skills: [${notFoundSkillNames}]`)
  }

  return skills
}

/**
 * Validate if all roles exist.
 *
 * @param {Array} roles the list of roles
 * @returns {undefined}
 */
async function _validateRoles (roles) {
  const foundRolesObj = await models.Role.findAll({
    where: {
      id: roles
    },
    attributes: ['id'],
    raw: true
  })
  const foundRoles = _.map(foundRolesObj, 'id')
  const nonexistentRoles = _.difference(roles, foundRoles)
  if (nonexistentRoles.length > 0) {
    throw new errors.BadRequestError(`Invalid roles: [${nonexistentRoles}]`)
  }
}

/**
 * Check user permission for getting job.
 *
 * @param {Object} currentUser the user who perform this operation.
 * @param {String} projectId the project id
 * @returns {undefined}
 */
async function _checkUserPermissionForGetJob (currentUser, projectId) {
  if (!currentUser.hasManagePermission && !currentUser.isMachine && !currentUser.isConnectManager) {
    await helper.checkIsMemberOfProject(currentUser.userId, projectId)
  }
}

/**
 * Get job by id
 * @param {Object} currentUser the user who perform this operation.
 * @param {String} id the job id
 * @param {Boolean} fromDb flag if query db for data or not
 * @returns {Object} the job
 */
async function getJob (currentUser, id, fromDb = false) {
  logger.info({ component: 'JobService', context: 'getJob', message: 'try to query db for data' })
  const job = await Job.findById(id, true)

  await _checkUserPermissionForGetJob(currentUser, job.projectId) // check user permission

  job.dataValues.candidates = _.map(job.dataValues.candidates, (c) => c.dataValues)
  return job.dataValues
}

getJob.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  id: Joi.string().guid().required(),
  fromDb: Joi.boolean()
}).required()

/**
 * Create job. All member can create a job.
 * @params {Object} currentUser the user who perform this operation
 * @params {Object} job the job to be created
 * @returns {Object} the created job
 */
async function createJob (currentUser, job, onTeamCreating) {
  // check user permission
  if (!currentUser.hasManagePermission && !currentUser.isMachine) {
    await helper.checkIsMemberOfProject(currentUser.userId, job.projectId)
  }

  // the "isApplicationPageActive" field can be set/updated only by M2M user
  if (!_.isUndefined(job.isApplicationPageActive) && !currentUser.isMachine) {
    throw new errors.ForbiddenError('You are not allowed to set/update the value of field "isApplicationPageActive".')
  }

  await _validateSkills(job.skills)
  // Save the full skills array, with names, for use later
  const skills = job.skills
  if (job.roleIds) {
    job.roleIds = _.uniq(job.roleIds)
    await _validateRoles(job.roleIds)
  }
  job.id = uuid()
  job.createdBy = await helper.getUserId(currentUser.userId)

  // Compact the skills to *just* the IDs for saving to ES
  job.skills = _.chain(job.skills).map('skillId').uniq().compact().value()
  let entity
  try {
    await sequelize.transaction(async (t) => {
      entity = (await Job.create(job, { transaction: t })).toJSON()
    })
    await helper.registerSkills(job)
  } catch (e) {
    logger.error(`Error occurred while creating job, rolling back, error: ${e.message}`)
    logger.debug(`Job object dump: ${JSON.stringify(job)}`)

    if (entity) {
      helper.postErrorEvent(config.TAAS_ERROR_TOPIC, entity, 'job.create')
      await Job.destroy({
        where: {
          id: entity.id
        }
      })
    }
    throw e
  }

  // Add back in the expanded skills for the Kafka queue event
  entity.skills = skills
  await helper.postEvent(config.TAAS_JOB_CREATE_TOPIC, entity, { onTeamCreating })
  return entity
}

createJob.schema = Joi.object()
  .keys({
    currentUser: Joi.object().required(),
    job: Joi.object()
      .keys({
        status: Joi.jobStatus().default('sourcing'),
        projectId: Joi.number().integer().required(),
        externalId: Joi.string().allow(null),
        description: Joi.stringAllowEmpty().allow(null),
        title: Joi.title().required(),
        startDate: Joi.date().format('YYYY-MM-DD').allow(null),
        duration: Joi.number().integer().min(1).allow(null),
        numPositions: Joi.number().integer().min(1).required(),
        resourceType: Joi.stringAllowEmpty().allow(null),
        rateType: Joi.rateType().allow(null),
        workload: Joi.workload().allow(null),
        skills: Joi.array().required(),
        isApplicationPageActive: Joi.boolean(),
        minSalary: Joi.number().integer().allow(null),
        maxSalary: Joi.number().integer().allow(null),
        hoursPerWeek: Joi.number().integer().allow(null),
        jobLocation: Joi.stringAllowEmpty().allow(null),
        jobTimezone: Joi.stringAllowEmpty().allow(null),
        currency: Joi.stringAllowEmpty().allow(null),
        roleIds: Joi.array().items(Joi.string().uuid().required()),
        showInHotList: Joi.boolean().default(false),
        featured: Joi.boolean().default(false),
        hotListExcerpt: Joi.stringAllowEmpty().default(''),
        jobTag: Joi.jobTag().default(''),
        rcrmStatus: Joi.jobRcrmStatus().default('Open'),
        rcrmReason: Joi.stringAllowEmpty().allow(null).default(null)
      })
      .required(),
    onTeamCreating: Joi.boolean().default(false)
  })
  .required()

/**
 * Update job. Normal user can only update the job he/she created.
 * @params {Object} currentUser the user who perform this operation
 * @params {String} job id
 * @params {Object} data the data to be updated
 * @returns {Object} the updated job
 */
async function updateJob (currentUser, id, data) {
  logger.debug({ component: 'JobService', context: 'updateJob start', message: `Arguments: ${JSON.stringify(currentUser)} job id: ${id} data: ${JSON.stringify(data)}` })

  let skills = data.skills

  if (data.skills) {
    await _validateSkills(data.skills)

    // Compact the skills to *just* the IDs for saving to ES
    data.skills = _.chain(skills).map('skillId').uniq().compact().value()
  }
  if (data.skillNames) {
    skills = await _validateAndGetSkillsByNames(data.skillNames)

    data = _.omit(data, 'skillNames')

    // Compact the skills to *just* the IDs for saving to ES
    data.skills = _.chain(skills).map('id').uniq().compact().value()
  }

  if (data.roleIds) {
    data.roleIds = _.uniq(data.roleIds)
    await _validateRoles(data.roleIds)
  }
  let job = await Job.findById(id)
  const oldValue = job.toJSON()

  // the "isApplicationPageActive" field can be set/updated only by M2M user
  if (!_.isUndefined(data.isApplicationPageActive) && !currentUser.isMachine) {
    throw new errors.ForbiddenError('You are not allowed to set/update the value of field "isApplicationPageActive".')
  }

  const ubahnUserId = await helper.getUserId(currentUser.userId)
  if (!currentUser.hasManagePermission && !currentUser.isMachine) {
    // Check whether user can update the job.
    // Note that there is no need to check if user is member of the project associated with the job here
    // because user who created the job must be the member of the project associated with the job
    if (ubahnUserId !== job.createdBy) {
      throw new errors.ForbiddenError('You are not allowed to perform this action!')
    }
  }

  data.updatedBy = ubahnUserId

  let entity
  try {
    logger.debug({ component: 'JobService', context: 'updateJob update transaction', message: `Data: ${JSON.stringify(data)}` })

    await sequelize.transaction(async (t) => {
      entity = (await job.update(data, { transaction: t })).toJSON()
      await helper.registerSkills(job)
    })
  } catch (e) {
    if (entity) {
      helper.postErrorEvent(config.TAAS_ERROR_TOPIC, entity, 'job.update')
    }
    throw e
  }
  await helper.postEvent(config.TAAS_JOB_UPDATE_TOPIC, entity, { oldValue: oldValue })
  job = await Job.findById(id, true)
  job.dataValues.candidates = _.map(job.dataValues.candidates, (c) => c.dataValues)
  return job.dataValues
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

partiallyUpdateJob.schema = Joi.object()
  .keys({
    currentUser: Joi.object().required(),
    id: Joi.string().guid().required(),
    data: Joi.object()
      .keys({
        status: Joi.jobStatus(),
        externalId: Joi.string().allow(null),
        description: Joi.stringAllowEmpty().allow(null),
        title: Joi.title(),
        startDate: Joi.date().format('YYYY-MM-DD').allow(null),
        duration: Joi.number().integer().min(1).allow(null),
        numPositions: Joi.number().integer().min(1),
        resourceType: Joi.stringAllowEmpty().allow(null),
        rateType: Joi.rateType().allow(null),
        workload: Joi.workload().allow(null),
        skills: Joi.array().allow(null),
        skillNames: Joi.array().allow(null),
        isApplicationPageActive: Joi.boolean(),
        minSalary: Joi.number().integer(),
        maxSalary: Joi.number().integer(),
        hoursPerWeek: Joi.number().integer(),
        jobLocation: Joi.stringAllowEmpty().allow(null),
        jobTimezone: Joi.stringAllowEmpty().allow(null),
        currency: Joi.stringAllowEmpty().allow(null),
        roleIds: Joi.array().items(Joi.string().uuid().required()).allow(null),
        showInHotList: Joi.boolean(),
        featured: Joi.boolean(),
        hotListExcerpt: Joi.stringAllowEmpty(),
        jobTag: Joi.jobTag(),
        rcrmStatus: Joi.jobRcrmStatus(),
        rcrmReason: Joi.stringAllowEmpty().allow(null)
      })
      .required()
  })
  .required()

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
    externalId: Joi.string().allow(null).default(null),
    description: Joi.stringAllowEmpty().allow(null).default(null),
    title: Joi.title().required(),
    startDate: Joi.date().format('YYYY-MM-DD').allow(null).default(null),
    duration: Joi.number().integer().min(1).allow(null).default(null),
    numPositions: Joi.number().integer().min(1).required(),
    resourceType: Joi.stringAllowEmpty().allow(null).default(null),
    rateType: Joi.rateType().allow(null).default(null),
    workload: Joi.workload().allow(null).default(null),
    skills: Joi.array().items(Joi.string().uuid()).required(),
    status: Joi.jobStatus().default('sourcing'),
    isApplicationPageActive: Joi.boolean(),
    minSalary: Joi.number().integer().allow(null),
    maxSalary: Joi.number().integer().allow(null),
    hoursPerWeek: Joi.number().integer().allow(null),
    jobLocation: Joi.stringAllowEmpty().allow(null),
    jobTimezone: Joi.stringAllowEmpty().allow(null),
    currency: Joi.stringAllowEmpty().allow(null),
    roleIds: Joi.array().items(Joi.string().uuid().required()).default(null),
    showInHotList: Joi.boolean().default(false),
    featured: Joi.boolean().default(false),
    hotListExcerpt: Joi.stringAllowEmpty().default(''),
    jobTag: Joi.jobTag().default(''),
    rcrmStatus: Joi.jobRcrmStatus().default(null),
    rcrmReason: Joi.stringAllowEmpty().allow(null).default(null)
  }).required()
}).required()

/**
 * Delete job by id.
 * @params {Object} currentUser the user who perform this operation
 * @params {String} id the job id
 */
async function deleteJob (currentUser, id) {
  // check user permission
  if (!currentUser.hasManagePermission && !currentUser.isMachine) {
    throw new errors.ForbiddenError('You are not allowed to perform this action!')
  }

  const job = await Job.findById(id)
  try {
    await sequelize.transaction(async (t) => {
      await job.destroy({ transaction: t })
    })
  } catch (e) {
    helper.postErrorEvent(config.TAAS_ERROR_TOPIC, { id }, 'job.delete')
    throw e
  }
  await helper.postEvent(config.TAAS_JOB_DELETE_TOPIC, { id })
}

deleteJob.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  id: Joi.string().guid().required()
}).required()

/**
 * List jobs
 * @param {Object} currentUser the user who perform this operation.
 * @params {Object} criteria the search criteria
 * @params {Object} options the extra options to control the function
 * @returns {Object} the search result, contain total/page/perPage and result array
 */
async function searchJobs (currentUser, criteria, options = { returnAll: false }) {
  // check user permission
  if (!currentUser.hasManagePermission && !currentUser.isMachine && !currentUser.isConnectManager && !options.returnAll) {
    if (!criteria.projectId) { // regular user can only search with filtering by "projectId"
      throw new errors.ForbiddenError('Not allowed without filtering by "projectId"')
    }
    await helper.checkIsMemberOfProject(currentUser.userId, criteria.projectId)
  }

  const page = criteria.page > 0 ? criteria.page : 1
  let perPage
  if (options.returnAll || criteria.specialJob) {
    // To simplify the logic we are use a very large number for perPage
    // because in practice there could hardly be so many records to be returned.(also consider we are using filters in the meantime)
    // the number is limited by `index.max_result_window`, its default value is 10000, see
    // https://www.elastic.co/guide/en/elasticsearch/reference/current/index-modules.html#index-max-result-window
    //
    // also see `ResourceBookingService.searchResourceBookings()`
    perPage = 10000
  } else {
    perPage = criteria.perPage > 0 ? criteria.perPage : 20
  }
  if (!criteria.sortBy) {
    criteria.sortBy = 'id'
  }
  if (!criteria.sortOrder) {
    criteria.sortOrder = 'desc'
  }
  logger.info({ component: 'JobService', context: 'searchJobs', message: 'fallback to DB query' })
  const filter = { [Op.and]: [] }
  _.each(_.pick(criteria, [
    'isApplicationPageActive',
    'projectId',
    'externalId',
    'startDate',
    'resourceType',
    'rateType',
    'workload',
    'status',
    'featured',
    'rcrmStatus'
  ]), (value, key) => {
    filter[Op.and].push({ [key]: value })
  })
  if (criteria.description) {
    filter.description = {
      [Op.like]: `%${criteria.description}%`
    }
  }
  if (criteria.title) {
    filter.title = {
      [Op.like]: `%${criteria.title}%`
    }
  }
  if (criteria.jobLocation) {
    filter.jobLocation = {
      [Op.like]: `%${criteria.jobLocation}%`
    }
  }
  if (criteria.skill || (criteria.bodySkills && criteria.bodySkills.length > 0)) {
    const skill = criteria.skill
    const bodySkills = criteria.bodySkills
    if (skill && bodySkills && bodySkills.length > 0) {
      filter.skills = {
        [Op.and]: [
          {
            [Op.contains]: [criteria.skill]
          },
          {
            [Op.or]: _.map(bodySkills, (item) => {
              return { [Op.contains]: [item] }
            })
          }
        ]
      }
    } else if (skill) {
      filter.skills = {
        [Op.contains]: [criteria.skill]
      }
    } else if (bodySkills && bodySkills.length > 0) {
      filter.skills = {
        [Op.or]: _.map(bodySkills, (item) => {
          return { [Op.contains]: [item] }
        })
      }
    }
  }
  if (criteria.role) {
    filter.roles = {
      [Op.contains]: [criteria.role]
    }
  }
  if (criteria.jobIds && criteria.jobIds.length > 0) {
    filter[Op.and].push({ id: criteria.jobIds })
  }
  if (criteria.minSalary !== undefined) {
    filter.minSalary = {
      [Op.gte]: criteria.minSalary
    }
  }
  if (criteria.maxSalary !== undefined) {
    filter.maxSalary = {
      [Op.lte]: criteria.maxSalary
    }
  }
  if (criteria.specialJob === true) {
    filter[Op.and].push({
      [Op.or]: [
        { featured: true },
        { showInHotList: true }
      ]
    })
  }
  if (criteria.specialJob === false) {
    filter[Op.and].push({ featured: false })
    filter[Op.and].push({ showInHotList: false })
  }
  const jobs = await Job.findAll({
    where: filter,
    offset: ((page - 1) * perPage),
    limit: perPage,
    order: [[criteria.sortBy, criteria.sortOrder]],
    include: [{
      model: models.JobCandidate,
      as: 'candidates',
      required: false
    }]
  })
  const total = await Job.count({ where: filter })
  return {
    fromDb: true,
    total,
    page,
    perPage,
    result: _.map(jobs, job => job.dataValues)
  }
}

searchJobs.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  criteria: Joi.object().keys({
    page: Joi.number().integer(),
    perPage: Joi.number().integer(),
    sortBy: Joi.string().valid('id', 'createdAt', 'updatedAt', 'startDate', 'rateType', 'status'),
    sortOrder: Joi.string().valid('desc', 'asc'),
    projectId: Joi.number().integer(),
    externalId: Joi.string(),
    isApplicationPageActive: Joi.boolean(),
    description: Joi.string(),
    title: Joi.title(),
    startDate: Joi.date().format('YYYY-MM-DD'),
    resourceType: Joi.string(),
    skill: Joi.string().uuid(),
    role: Joi.string().uuid(),
    rateType: Joi.rateType(),
    workload: Joi.workload(),
    status: Joi.jobStatus(),
    projectIds: Joi.array().items(Joi.number().integer()).single(),
    jobIds: Joi.array().items(Joi.string().uuid()),
    bodySkills: Joi.array().items(Joi.string().uuid()),
    minSalary: Joi.number().integer(),
    maxSalary: Joi.number().integer(),
    jobLocation: Joi.string(),
    specialJob: Joi.boolean(),
    featured: Joi.boolean(),
    rcrmStatus: Joi.string().valid('Open', 'On Hold', 'Canceled', 'Draft', 'Closed', 'Did not Post')
  }).required(),
  options: Joi.object()
}).required()

module.exports = {
  getJob,
  createJob,
  partiallyUpdateJob,
  fullyUpdateJob,
  deleteJob,
  searchJobs
}
