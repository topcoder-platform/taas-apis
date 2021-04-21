/**
 * This service provides operations of Interview.
 */

const _ = require('lodash')
const Joi = require('joi')
const config = require('config')
const { Op, ForeignKeyConstraintError } = require('sequelize')
const { v4: uuid } = require('uuid')
const { Interviews: InterviewConstants } = require('../../app-constants')
const helper = require('../common/helper')
const logger = require('../common/logger')
const errors = require('../common/errors')
const models = require('../models')

const Interview = models.Interview
const esClient = helper.getESClient()

/**
 * Handles common sequelize errors
 * @param {Object} err error
 * @param {String} jobCandidateId the job candidate id
 */
function handleSequelizeError (err, jobCandidateId) {
  // jobCandidateId doesn't exist - gracefully handle
  if (err instanceof ForeignKeyConstraintError) {
    throw new errors.NotFoundError(
          `The job candidate with id=${jobCandidateId} doesn't exist.`
    )
  }
  // another type of sequelize error - extract the details and throw
  const errDetail = _.get(err, 'original.detail')
  if (errDetail) {
    throw new errors.BadRequestError(errDetail)
  }
}

/**
 * Check Only Booking Manager, Admin, and M2M (Regular member) should be able to view or update.
 * @param {Object} currentUser the current user
 */
function checkPermission (currentUser) {
  // check user permission
  if (!currentUser.hasManagePermission && !currentUser.isMachine) {
    throw new errors.ForbiddenError('You are not allowed to perform this action!')
  }
}

/**
 * Get interview by round
 * @param {Object} currentUser the user who perform this operation.
 * @param {String} jobCandidateId the job candidate id
 * @param {Number} round the interview round
 * @param {Boolean} fromDb flag if query db for data or not
 * @returns {Object} the interview
 */
async function getInterviewByRound (currentUser, jobCandidateId, round, fromDb = false) {
  checkPermission(currentUser)

  if (!fromDb) {
    try {
      // get job candidate from ES
      const jobCandidateES = await esClient.get({
        index: config.esConfig.ES_INDEX_JOB_CANDIDATE,
        id: jobCandidateId
      })
      // extract interviews from ES object
      const jobCandidateInterviews = _.get(jobCandidateES, 'body._source.interviews', [])
      // find interview by round
      const interview = _.find(jobCandidateInterviews, interview => interview.round === round)
      if (interview) {
        return interview
      }
      // if reaches here, the interview with this round is not found
      throw new errors.NotFoundError(`Interview doesn't exist with round: ${round}`)
    } catch (err) {
      if (helper.isDocumentMissingException(err)) {
        throw new errors.NotFoundError(`id: ${jobCandidateId} "JobCandidate" not found`)
      }
      logger.logFullError(err, { component: 'InterviewService', context: 'getInterviewByRound' })
      throw err
    }
  }
  // either ES query failed or `fromDb` is set - fallback to DB
  logger.info({ component: 'InterviewService', context: 'getInterview', message: 'try to query db for data' })

  const interview = await Interview.findOne({
    where: { jobCandidateId, round }
  })
  return interview.dataValues
}

getInterviewByRound.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  jobCandidateId: Joi.string().uuid().required(),
  round: Joi.number().integer().positive().required(),
  fromDb: Joi.boolean()
}).required()

/**
 * Request interview
 * @param {Object} currentUser the user who perform this operation
 * @param {String} jobCandidateId the job candidate id
 * @param {Object} interview the interview to be created
 * @returns {Object} the created/requested interview
 */
async function requestInterview (currentUser, jobCandidateId, interview) {
  checkPermission(currentUser)

  interview.id = uuid()
  interview.jobCandidateId = jobCandidateId
  interview.createdBy = await helper.getUserId(currentUser.userId)

  // find the round count
  const round = await Interview.count({
    where: { jobCandidateId }
  })
  interview.round = round + 1

  // create
  try {
    const created = await Interview.create(interview)
    await helper.postEvent(config.TAAS_INTERVIEW_REQUEST_TOPIC, created.toJSON())
    return created.dataValues
  } catch (err) {
    // gracefully handle if one of the common sequelize errors
    handleSequelizeError(err, jobCandidateId)
    // if reaches here, it's not one of the common errors handled in `handleSequelizeError`
    throw err
  }
}

requestInterview.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  jobCandidateId: Joi.string().uuid().required(),
  interview: Joi.object().keys({
    googleCalendarId: Joi.string(),
    customMessage: Joi.string(),
    xaiTemplate: Joi.string().valid(...config.INTERVIEW_INVITATION_XAI_TEMPLATE_ID).required(),
    status: Joi.interviewStatus().default(InterviewConstants.Status.Scheduling),
    attendeesList: Joi.array().items(Joi.string().email()),
    startTimestamp: Joi.date().iso().greater('now')
  }).required()
}).required()

/**
 * List interviews
 * @param {String} jobCandidateId the job candidate id
 * @param {Object} criteria the search criteria
 * @returns {Object} the search result, contain total/page/perPage and result array
 */
async function searchInterviews (currentUser, jobCandidateId, criteria) {
  checkPermission(currentUser)

  const { page, perPage } = criteria
  try {
    // search
    // get job candidate from ES
    const jobCandidateES = await esClient.get({
      index: config.esConfig.ES_INDEX_JOB_CANDIDATE,
      id: jobCandidateId
    })
    // extract interviews from ES object
    const jobCandidateInterviews = _.get(jobCandidateES, 'body._source.interviews', [])
    // filter and sort
    const sortedInterviews = _.orderBy(_.filter(jobCandidateInterviews, interview => _.every(_.pick(criteria, ['status', 'createdAt', 'updatedAt']), (v, k) => interview[k] === v)), criteria.sortBy, criteria.sortOrder)
    // paginate
    const start = (page - 1) * perPage
    const end = start + perPage
    const paginatedInterviews = _.slice(sortedInterviews, start, end)

    return {
      total: sortedInterviews.length,
      page,
      perPage,
      result: paginatedInterviews
    }
  } catch (err) {
    logger.logFullError(err, { component: 'InterviewService', context: 'searchInterviews' })
  }
  logger.info({ component: 'InterviewService', context: 'searchInterviews', message: 'fallback to DB query' })
  const filter = {
    [Op.and]: [{ jobCandidateId }]
  }
  // apply filtering based on criteria
  _.each(_.pick(criteria, ['status', 'createdAt', 'updatedAt']), (value, key) => {
    filter[Op.and].push({ [key]: value })
  })
  const interviews = await Interview.findAll({
    where: filter,
    offset: ((page - 1) * perPage),
    limit: perPage,
    order: [[criteria.sortBy, criteria.sortOrder]]
  })
  return {
    fromDb: true,
    total: interviews.length,
    page,
    perPage,
    result: _.map(interviews, interview => interview.dataValues)
  }
}

searchInterviews.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  jobCandidateId: Joi.string().uuid().required(),
  criteria: Joi.object().keys({
    page: Joi.page(),
    perPage: Joi.perPage(),
    sortBy: Joi.string().valid('round', 'createdAt', 'updatedAt').default('createdAt'),
    sortOrder: Joi.string().valid('desc', 'asc').default('desc'),
    createdAt: Joi.date(),
    updatedAt: Joi.date(),
    status: Joi.interviewStatus()
  }).required()
}).required()

/**
 * Update interview by round
 * @param {Object} currentUser the user who perform this operation
 * @param {String} jobCandidateId the job candidate id
 * @param {Number} round the interview round
 * @param {Object} data the data to updated
 * @returns {Object} the created/requested interview
 */
async function updateInterviewByRound (currentUser, jobCandidateId, round, data) {
  checkPermission(currentUser)

  const interview = await Interview.findOne({
    where: { jobCandidateId, round }
  })
  if (!interview) {
    throw new errors.NotFoundError(`jobCandidateId: ${jobCandidateId}, round: ${round} "Interview" doesn't exist.`)
  }
  const oldValue = interview.toJSON()
  data.updatedBy = await helper.getUserId(currentUser.userId)
  const updated = await interview.update(data)
  await helper.postEvent(config.TAAS_INTERVIEW_UPDATE_TOPIC, updated.toJSON(), { oldValue: oldValue })
  return updated.dataValues
}

updateInterviewByRound.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  jobCandidateId: Joi.string().uuid().required(),
  round: Joi.number().integer().positive().required(),
  data: Joi.object().keys({
    googleCalendarId: Joi.string(),
    customMessage: Joi.string(),
    xaiTemplate: Joi.string().valid(...config.INTERVIEW_INVITATION_XAI_TEMPLATE_ID),
    status: Joi.interviewStatus(),
    attendeesList: Joi.array().items(Joi.string().email()),
    startTimestamp: Joi.date().iso().greater('now')
  }).required()
}).required()

module.exports = {
  getInterviewByRound,
  requestInterview,
  searchInterviews,
  updateInterviewByRound
}
