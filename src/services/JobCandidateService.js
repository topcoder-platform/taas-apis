/**
 * This service provides operations of JobCandidate.
 */

const _ = require('lodash')
const Joi = require('joi')
const config = require('config')
const { Op } = require('sequelize')
const { v4: uuid } = require('uuid')
const { Scopes, UserRoles } = require('../../app-constants')
const helper = require('../common/helper')
const logger = require('../common/logger')
const errors = require('../common/errors')
const models = require('../models')
const JobService = require('./JobService')

const sequelize = models.sequelize
const NotificationSchedulerService = require('./NotificationsSchedulerService')
const JobCandidate = models.JobCandidate

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
 * Returns field omit list, based on user access level.
 *
 * @param {Object} currentUser the user who perform this operation.
 * @returns {Array} the field list to omit from the jobCandidate object
 */
function getJobCandidateOmitList (currentUser) {
  // check M2M scopes for Interviews
  if (currentUser.isMachine) {
    const interviewsAllowedScopes = [Scopes.READ_INTERVIEW, Scopes.ALL_INTERVIEW]
    if (!currentUser.scopes || !helper.checkIfExists(interviewsAllowedScopes, currentUser.scopes)) {
      return ['interviews']
    }
    return []
  }
  return currentUser.hasManagePermission ? [] : ['interviews']
}

/**
 * Get jobCandidate by id
 * @param {Object} currentUser the user who perform this operation.
 * @param {String} id the jobCandidate id
 * @param {Boolean} fromDb flag if query db for data or not
 * @returns {Object} the jobCandidate
 */
async function getJobCandidate (currentUser, id, fromDb = false) {
  const omitList = getJobCandidateOmitList(currentUser)

  logger.info({ component: 'JobCandidateService', context: 'getJobCandidate', message: 'try to query db for data' })
  // include interviews if user has permission
  const include = []
  const hasInterviewPermision = !_.includes(omitList, 'interviews')
  if (hasInterviewPermision) {
    include.push({ model: models.Interview, as: 'interviews' })
  }
  const jobCandidate = await JobCandidate.findById(id, include)

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
  await helper.ensureTopcoderUserIdExists(jobCandidate.tcUserId) // ensure user exists

  jobCandidate.id = uuid()
  jobCandidate.createdBy = await helper.getUserId(currentUser.userId)

  let entity
  try {
    await sequelize.transaction(async (t) => {
      await JobCandidate.create(jobCandidate, { transaction: t })
    })
  } catch (e) {
    logger.error(`Error encountered in creating job candidate: ${JSON.stringify(e)}`)
    throw e
  }
  return entity
}

createJobCandidate.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  jobCandidate: Joi.object().keys({
    status: Joi.jobCandidateStatus().default('open'),
    jobId: Joi.string().uuid().required(),
    tcUserId: Joi.number().integer().required(),
    externalId: Joi.string().allow(null),
    resume: Joi.string().uri().allow(null),
    remark: Joi.stringAllowEmpty().allow(null)
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
  const oldValue = jobCandidate.toJSON()
  const userId = await helper.getUserId(currentUser.userId)

  // check user permission
  if (!currentUser.hasManagePermission && !currentUser.isMachine) {
    const job = await models.Job.findById(jobCandidate.jobId)
    await helper.checkIsMemberOfProject(currentUser.userId, job.projectId)
  }

  data.updatedBy = userId

  let entity
  try {
    await sequelize.transaction(async (t) => {
      await jobCandidate.update(data, { transaction: t })
    })
  } catch (e) {
    logger.error(`Error encountered in updating job candidate with id ${id}: ${JSON.stringify(e)}`)
    throw e
  }
  await helper.postEvent(config.TAAS_JOB_CANDIDATE_UPDATE_TOPIC, entity, { oldValue: oldValue })
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
    externalId: Joi.string().allow(null),
    viewedByCustomer: Joi.boolean().allow(null),
    resume: Joi.string().uri().allow(null),
    remark: Joi.stringAllowEmpty().allow(null)
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
  await helper.ensureTopcoderUserIdExists(data.tcUserId) // ensure user exists
  return updateJobCandidate(currentUser, id, data)
}

fullyUpdateJobCandidate.schema = Joi.object()
  .keys({
    currentUser: Joi.object().required(),
    id: Joi.string().uuid().required(),
    data: Joi.object()
      .keys({
        jobId: Joi.string().uuid().required(),
        tcUserId: Joi.number().integer(),
        status: Joi.jobCandidateStatus().default('open'),
        viewedByCustomer: Joi.boolean().allow(null),
        externalId: Joi.string().allow(null).default(null),
        resume: Joi.string().uri().allow('').allow(null).default(null),
        remark: Joi.stringAllowEmpty().allow(null)
      })
      .required()
  })
  .required()

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
  try {
    await sequelize.transaction(async (t) => {
      await jobCandidate.destroy({ transaction: t })
    })
  } catch (e) {
    logger.error(`Error encountered in deleting job candidate with id ${id}: ${JSON.stringify(e)}`)
    throw e
  }
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

  const omitList = getJobCandidateOmitList(currentUser)
  const page = criteria.page > 0 ? criteria.page : 1
  const perPage = criteria.perPage > 0 ? criteria.perPage : 20
  if (!criteria.sortBy) {
    criteria.sortBy = 'id'
  }
  if (!criteria.sortOrder) {
    criteria.sortOrder = 'desc'
  }
  logger.info({ component: 'JobCandidateService', context: 'searchJobCandidates', message: 'fallback to DB query' })
  const filter = { [Op.and]: [] }
  _.each(_.pick(criteria, ['jobId', 'tcUserId', 'status', 'externalId']), (value, key) => {
    filter[Op.and].push({ [key]: value })
  })
  if (criteria.statuses && criteria.statuses.length > 0) {
    filter[Op.and].push({ status: criteria.statuses })
  }

  // include interviews if user has permission
  const include = []
  const hasInterviewPermision = !_.includes(omitList, 'interviews')
  if (hasInterviewPermision) {
    include.push({ model: models.Interview, as: 'interviews' })
  }

  const jobCandidates = await JobCandidate.findAll({
    where: filter,
    include,
    offset: ((page - 1) * perPage),
    limit: perPage,
    order: [[criteria.sortBy, criteria.sortOrder]]
  })
  const total = await JobCandidate.count({ where: filter })
  return {
    fromDb: true,
    total,
    page,
    perPage,
    result: _.map(jobCandidates, jobCandidate => _.omit(jobCandidate.dataValues, omitList))
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
    tcUserId: Joi.number().integer(),
    status: Joi.jobCandidateStatus(),
    statuses: Joi.array().items(Joi.jobCandidateStatus()),
    externalId: Joi.string()
  }).required()
}).required()

/**
 * Download jobCandidate resume
 * @params {Object} currentUser the user who perform this operation
 * @params {String} id the jobCandidate id
 */
async function downloadJobCandidateResume (currentUser, id) {
  const jobCandidate = await JobCandidate.findById(id)

  // customer role
  if (!jobCandidate.viewedByCustomer && currentUser.userId !== jobCandidate.tcUserId && currentUser.roles.length === 1 && currentUser.roles[0] === UserRoles.TopcoderUser) {
    try {
      const job = await models.Job.findById(jobCandidate.jobId)
      const { handle } = await helper.ensureTopcoderUserIdExists(jobCandidate.tcUserId)

      await NotificationSchedulerService.sendNotification(currentUser, {
        template: 'taas.notification.job-candidate-resume-viewed',
        recipients: [{ handle }],
        data: {
          jobCandidateUserHandle: handle,
          jobName: job.title,
          applicationUrl: `${config.TAAS_APP_EARN_URL}?status=Active%20Gigs`
        }
      })

      await updateJobCandidate(currentUser, jobCandidate.id, { viewedByCustomer: true })
    } catch (err) {
      logger.logFullError(err, { component: 'JobCandidateService', context: 'downloadJobCandidateResume' })
    }
  }

  return jobCandidate.resume
}

downloadJobCandidateResume.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  id: Joi.string().uuid().required()
}).required()

module.exports = {
  getJobCandidate,
  createJobCandidate,
  partiallyUpdateJobCandidate,
  fullyUpdateJobCandidate,
  deleteJobCandidate,
  searchJobCandidates,
  downloadJobCandidateResume
}
