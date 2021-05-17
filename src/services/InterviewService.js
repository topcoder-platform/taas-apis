/**
 * This service provides operations of Interview.
 */

const _ = require('lodash')
const Joi = require('joi')
const moment = require('moment')
const config = require('config')
const { Op, ForeignKeyConstraintError } = require('sequelize')
const { v4: uuid, validate: uuidValidate } = require('uuid')
const { Interviews: InterviewConstants } = require('../../app-constants')
const helper = require('../common/helper')
const logger = require('../common/logger')
const errors = require('../common/errors')
const models = require('../models')

const Interview = models.Interview
const esClient = helper.getESClient()

/**
  * Ensures user is permitted for the operation.
  *
  * @param {Object} currentUser the user who perform this operation.
  * @param {String} jobCandidateId the job candidate id
  * @throws {errors.ForbiddenError}
  */
async function ensureUserIsPermitted (currentUser, jobCandidateId) {
  if (!currentUser.hasManagePermission && !currentUser.isMachine) {
    const jobCandidate = await models.JobCandidate.findById(jobCandidateId)
    const job = await jobCandidate.getJob()
    await helper.checkIsMemberOfProject(currentUser.userId, job.projectId)
  }
}

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
 * Get interview by round
 * @param {Object} currentUser the user who perform this operation.
 * @param {String} jobCandidateId the job candidate id
 * @param {Number} round the interview round
 * @param {Boolean} fromDb flag if query db for data or not
 * @returns {Object} the interview
 */
async function getInterviewByRound (currentUser, jobCandidateId, round, fromDb = false) {
  // check permission
  await ensureUserIsPermitted(currentUser, jobCandidateId)
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
  logger.info({ component: 'InterviewService', context: 'getInterviewByRound', message: 'try to query db for data' })

  const interview = await Interview.findOne({
    where: { jobCandidateId, round }
  })
  // throw NotFound error if doesn't exist
  if (!!interview !== true) {
    throw new errors.NotFoundError(`Interview doesn't exist with jobCandidateId: ${jobCandidateId} and round: ${round}`)
  }

  return interview.dataValues
}

getInterviewByRound.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  jobCandidateId: Joi.string().uuid().required(),
  round: Joi.number().integer().positive().required(),
  fromDb: Joi.boolean()
}).required()

/**
 * Get interview by id
 * @param {Object} currentUser the user who perform this operation.
 * @param {String} id the interview or xai id
 * @param {Boolean} fromDb flag if query db for data or not
 * @returns {Object} the interview
 */
async function getInterviewById (currentUser, id, fromDb = false) {
  if (!fromDb) {
    try {
      // construct query for nested search
      const esQueryBody = {
        _source: false,
        query: {
          nested: {
            path: 'interviews',
            query: {
              bool: {
                should: []
              }
            },
            inner_hits: {}
          }
        }
      }
      // add filtering terms
      // interviewId
      esQueryBody.query.nested.query.bool.should.push({
        term: {
          'interviews.id': {
            value: id
          }
        }
      })
      // xaiId
      esQueryBody.query.nested.query.bool.should.push({
        term: {
          'interviews.xaiId': {
            value: id
          }
        }
      })
      // search
      const { body } = await esClient.search({
        index: config.esConfig.ES_INDEX_JOB_CANDIDATE,
        body: esQueryBody
      })
      // extract inner interview hit from body - there's always one jobCandidate & interview hit as we search with IDs
      const interview = _.get(body, 'hits.hits[0].inner_hits.interviews.hits.hits[0]._source')
      if (interview) {
        // check permission before returning
        await ensureUserIsPermitted(currentUser, interview.jobCandidateId)
        return interview
      }
      // if reaches here, the interview with this IDs is not found
      throw new errors.NotFoundError(`Interview doesn't exist with id/xaiId: ${id}`)
    } catch (err) {
      logger.logFullError(err, { component: 'InterviewService', context: 'getInterviewById' })
      throw err
    }
  }
  // either ES query failed or `fromDb` is set - fallback to DB
  logger.info({ component: 'InterviewService', context: 'getInterviewById', message: 'try to query db for data' })
  var interview
  if (uuidValidate(id)) {
    interview = await Interview.findOne({
      where: {
        [Op.or]: [
          { id }
        ]
      }
    })
  } else {
    interview = await Interview.findOne({
      where: {
        [Op.or]: [
          { xaiId: id }
        ]
      }
    })
  }
  // throw NotFound error if doesn't exist
  if (!!interview !== true) {
    throw new errors.NotFoundError(`Interview doesn't exist with id/xaiId: ${id}`)
  }
  // check permission before returning
  await ensureUserIsPermitted(currentUser, interview.jobCandidateId)

  return interview.dataValues
}

getInterviewById.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  id: Joi.string().required(),
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
  // check permission
  await ensureUserIsPermitted(currentUser, jobCandidateId)

  // find the round count
  const round = await Interview.count({
    where: { jobCandidateId }
  })

  // throw error if candidate has already had MaxAllowedCount interviews
  if (round >= InterviewConstants.MaxAllowedCount) {
    throw new errors.ConflictError(`You've reached the maximum allowed number (${InterviewConstants.MaxAllowedCount}) of interviews for this candidate.`)
  }

  // get job candidate user details
  const jobCandidate = await models.JobCandidate.findById(jobCandidateId)
  const jobCandidateUser = await helper.getUserById(jobCandidate.userId)
  const jobCandidateMember = await helper.getUserByHandle(jobCandidateUser.handle)
  // pre-populate fields
  interview.id = uuid()
  interview.jobCandidateId = jobCandidateId
  interview.round = round + 1
  interview.duration = InterviewConstants.XaiTemplate[interview.templateUrl]
  interview.createdBy = await helper.getUserId(currentUser.userId)
  interview.guestEmails = [jobCandidateMember.email, ...interview.guestEmails]
  // pre-populate hostName & guestNames
  const hostMembers = await helper.getMemberDetailsByEmails([interview.hostEmail])
  const guestMembers = await helper.getMemberDetailsByEmails(interview.guestEmails)
  interview.hostName = `${hostMembers[0].firstName} ${hostMembers[0].lastName}`
  interview.guestNames = _.flatten(_.map(interview.guestEmails, (guestEmail) => {
    return _.map(guestMembers, (guestMember) => {
      return (guestEmail === guestMember.email) ? `${guestMember.firstName} ${guestMember.lastName}` : guestEmail.split('@')[0]
    })
  }))

  try {
    // create the interview
    const created = await Interview.create(interview)
    await helper.postEvent(config.TAAS_INTERVIEW_REQUEST_TOPIC, created.toJSON())
    // update jobCandidate.status to Interview
    const [, affectedRows] = await models.JobCandidate.update(
      { status: 'interview' },
      { where: { id: created.jobCandidateId }, returning: true }
    )
    const updatedJobCandidate = _.omit(_.get(affectedRows, '0.dataValues'), 'deletedAt')
    await helper.postEvent(config.TAAS_JOB_CANDIDATE_UPDATE_TOPIC, updatedJobCandidate)
    // return created interview
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
    calendarEventId: Joi.string().allow(null),
    templateUrl: Joi.xaiTemplate().required(),
    hostEmail: Joi.string().email().required(),
    guestEmails: Joi.array().items(Joi.string().email()).default([]),
    status: Joi.interviewStatus().default(InterviewConstants.Status.Scheduling)
  }).required()
}).required()

/**
 * Updates interview
 *
 * @param {Object} currentUser user who performs the operation
 * @param {Object} interview the existing interview object
 * @param {Object} data object containing updated fields
 * @returns {Object} updated interview
 */
async function partiallyUpdateInterview (currentUser, interview, data) {
  // only status can be updated for Completed interviews
  if (interview.status === InterviewConstants.Status.Completed) {
    const updatedFields = _.keys(data)
    if (updatedFields.length !== 1 || !_.includes(updatedFields, 'status')) {
      throw new errors.BadRequestError('Only the "status" can be updated for Completed interviews.')
    }
  }

  // automatically set endTimestamp if startTimestamp is provided
  if (data.startTimestamp && !!data.endTimestamp !== true) {
    data.endTimestamp = moment(data.startTimestamp).add(interview.duration, 'minutes').toDate()
  }

  data.updatedBy = await helper.getUserId(currentUser.userId)
  try {
    const updated = await interview.update(data)
    await helper.postEvent(config.TAAS_INTERVIEW_UPDATE_TOPIC, updated.toJSON(), { oldValue: interview.toJSON() })
    return updated.dataValues
  } catch (err) {
    // gracefully handle if one of the common sequelize errors
    handleSequelizeError(err, interview.jobCandidateId)
    // if reaches here, it's not one of the common errors handled in `handleSequelizeError`
    throw err
  }
}

/**
 * Patch (partially update) interview by round
 * @param {Object} currentUser the user who perform this operation
 * @param {String} jobCandidateId the job candidate id
 * @param {Number} round the interview round
 * @param {Object} data object containing patched fields
 * @returns {Object} the patched interview object
 */
async function partiallyUpdateInterviewByRound (currentUser, jobCandidateId, round, data) {
  const interview = await Interview.findOne({
    where: {
      jobCandidateId, round
    }
  })
  // throw NotFound error if doesn't exist
  if (!!interview !== true) {
    throw new errors.NotFoundError(`Interview doesn't exist with jobCandidateId: ${jobCandidateId} and round: ${round}`)
  }
  // check permission
  await ensureUserIsPermitted(currentUser, jobCandidateId)

  return await partiallyUpdateInterview(currentUser, interview, data)
}

partiallyUpdateInterviewByRound.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  jobCandidateId: Joi.string().uuid().required(),
  round: Joi.number().integer().positive().required(),
  data: Joi.object().keys({
    xaiId: Joi.string().allow(null),
    calendarEventId: Joi.string().when('status', {
      is: [InterviewConstants.Status.Scheduled, InterviewConstants.Status.Rescheduled],
      then: Joi.required(),
      otherwise: Joi.allow(null)
    }),
    templateUrl: Joi.xaiTemplate(),
    templateId: Joi.string().allow(null),
    templateType: Joi.string().allow(null),
    title: Joi.string().allow(null),
    locationDetails: Joi.string().allow(null),
    startTimestamp: Joi.date().greater('now').when('status', {
      is: [InterviewConstants.Status.Scheduled, InterviewConstants.Status.Rescheduled],
      then: Joi.required(),
      otherwise: Joi.allow(null)
    }),
    endTimestamp: Joi.date().greater(Joi.ref('startTimestamp')).when('status', {
      is: [InterviewConstants.Status.Scheduled, InterviewConstants.Status.Rescheduled],
      then: Joi.required(),
      otherwise: Joi.allow(null)
    }),
    hostName: Joi.string(),
    hostEmail: Joi.string().email(),
    guestNames: Joi.array().items(Joi.string()).allow(null),
    guestEmails: Joi.array().items(Joi.string().email()).allow(null),
    status: Joi.interviewStatus(),
    rescheduleUrl: Joi.string().allow(null)
  }).required().min(1) // at least one key - i.e. don't allow empty object
}).required()

/**
 * Patch (partially update) interview by id
 * @param {Object} currentUser the user who perform this operation
 * @param {String} id the interview or x.ai meeting id
 * @param {Object} data object containing patched fields
 * @returns {Object} the patched interview object
 */
async function partiallyUpdateInterviewById (currentUser, id, data) {
  var interview
  if (uuidValidate(id)) {
    interview = await Interview.findOne({
      where: {
        [Op.or]: [
          { id }
        ]
      }
    })
  } else {
    interview = await Interview.findOne({
      where: {
        [Op.or]: [
          { xaiId: id }
        ]
      }
    })
  }
  // throw NotFound error if doesn't exist
  if (!!interview !== true) {
    throw new errors.NotFoundError(`Interview doesn't exist with id/xaiId: ${id}`)
  }
  // check permission
  await ensureUserIsPermitted(currentUser, interview.jobCandidateId)

  return await partiallyUpdateInterview(currentUser, interview, data)
}

partiallyUpdateInterviewById.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  id: Joi.string().required(),
  data: Joi.object().keys({
    xaiId: Joi.string().required(),
    calendarEventId: Joi.string().when('status', {
      is: [InterviewConstants.Status.Scheduled, InterviewConstants.Status.Rescheduled],
      then: Joi.required(),
      otherwise: Joi.allow(null)
    }),
    templateUrl: Joi.xaiTemplate(),
    templateId: Joi.string().allow(null),
    templateType: Joi.string().allow(null),
    title: Joi.string().allow(null),
    locationDetails: Joi.string().allow(null),
    startTimestamp: Joi.date().greater('now').when('status', {
      is: [InterviewConstants.Status.Scheduled, InterviewConstants.Status.Rescheduled],
      then: Joi.required(),
      otherwise: Joi.allow(null)
    }),
    endTimestamp: Joi.date().greater(Joi.ref('startTimestamp')).when('status', {
      is: [InterviewConstants.Status.Scheduled, InterviewConstants.Status.Rescheduled],
      then: Joi.required(),
      otherwise: Joi.allow(null)
    }),
    hostName: Joi.string(),
    hostEmail: Joi.string().email(),
    guestNames: Joi.array().items(Joi.string()).allow(null),
    guestEmails: Joi.array().items(Joi.string().email()).allow(null),
    status: Joi.interviewStatus(),
    rescheduleUrl: Joi.string().allow(null)
  }).required().min(1) // at least one key - i.e. don't allow empty object
}).required()

/**
 * List interviews
 * @param {Object} currentUser the user who perform this operation.
 * @param {String} jobCandidateId the job candidate id
 * @param {Object} criteria the search criteria
 * @returns {Object} the search result, contain total/page/perPage and result array
 */
async function searchInterviews (currentUser, jobCandidateId, criteria) {
  // check permission
  await ensureUserIsPermitted(currentUser, jobCandidateId)

  const { page, perPage } = criteria

  try {
    // construct query for nested search
    const esQueryBody = {
      _source: false,
      query: {
        nested: {
          path: 'interviews',
          query: {
            bool: {
              must: []
            }
          },
          inner_hits: {
            size: 100 // max. inner_hits size
          }
        }
      }
    }
    // add filtering terms
    // jobCandidateId
    esQueryBody.query.nested.query.bool.must.push({
      term: {
        'interviews.jobCandidateId': {
          value: jobCandidateId
        }
      }
    })
    // criteria
    _.each(_.pick(criteria, ['status', 'createdAt', 'updatedAt']), (value, key) => {
      const innerKey = `interviews.${key}`
      esQueryBody.query.nested.query.bool.must.push({
        term: {
          [innerKey]: {
            value
          }
        }
      })
    })
    // search
    const { body } = await esClient.search({
      index: config.esConfig.ES_INDEX_JOB_CANDIDATE,
      body: esQueryBody
    })
    // get jobCandidate hit from body - there's always one jobCandidate hit as we search via jobCandidateId
    // extract inner interview hits from jobCandidate
    const interviewHits = _.get(body, 'hits.hits[0].inner_hits.interviews.hits.hits', [])
    const interviews = _.map(interviewHits, '_source')

    // we need to sort & paginate interviews manually
    // as it's not possible with ES query on nested type
    // (ES applies pagination & sorting on parent documents, not on the nested objects)

    // sort
    const sortedInterviews = _.orderBy(interviews, criteria.sortBy, criteria.sortOrder)
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
 * Updates the status of completed (based on startTimestamp) interviews.
 * If the startTimestamp of an interview is less than (or equal) the (currentDateTime - 1 hour)
 * it's considered as completed.
 */
async function updateCompletedInterviews () {
  logger.info({ component: 'InterviewService', context: 'updateCompletedInterviews', message: 'Running the scheduled job...' })
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const [affectedCount, updatedRows] = await Interview.update(
    // '00000000-0000-0000-0000-000000000000' - to indicate it's updated by the system job
    { status: InterviewConstants.Status.Completed, updatedBy: '00000000-0000-0000-0000-000000000000' },
    {
      where: {
        status: [InterviewConstants.Status.Scheduled, InterviewConstants.Status.Rescheduled],
        startTimestamp: {
          [Op.lte]: oneHourAgo
        }
      },
      returning: true
    }
  )

  // post event if there are affected/updated interviews
  if (affectedCount > 0) {
    // payload format:
    // {
    //   jobCandidateId: { interviewId: { affectedFields }, interviewId2: { affectedFields }, ... },
    //   jobCandidateId2: { interviewId: { affectedFields }, interviewId2: { affectedFields }, ... },
    //   ...
    // }
    const bulkUpdatePayload = {}
    // construct payload
    _.forEach(updatedRows, row => {
      const interview = row.toJSON()
      const affectedFields = _.pick(interview, ['status', 'updatedBy', 'updatedAt'])
      _.set(bulkUpdatePayload, [interview.jobCandidateId, interview.id], affectedFields)
    })
    // post event
    await helper.postEvent(config.TAAS_INTERVIEW_BULK_UPDATE_TOPIC, bulkUpdatePayload)
  }
  logger.info({ component: 'InterviewService', context: 'updateCompletedInterviews', message: `Completed running. Updated ${affectedCount} interviews.` })
}

module.exports = {
  getInterviewByRound,
  getInterviewById,
  requestInterview,
  partiallyUpdateInterviewByRound,
  partiallyUpdateInterviewById,
  searchInterviews,
  updateCompletedInterviews
}
