/**
 * This file defines helper methods
 */

const fs = require('fs')
const querystring = require('querystring')
const Confirm = require('prompt-confirm')
const Bottleneck = require('bottleneck')
const config = require('config')
const HttpStatus = require('http-status-codes')
const _ = require('lodash')
const request = require('superagent')
const errors = require('../common/errors')
const logger = require('./logger')
const models = require('../models')
const eventDispatcher = require('./eventDispatcher')
const busApi = require('@topcoder-platform/topcoder-bus-api-wrapper')
const moment = require('moment-timezone')
const { PaymentStatusRules, InterviewEventHandlerTimeout } = require('../../app-constants')
const emailTemplateConfig = require('../../config/email_template.config')
const { Mutex, withTimeout } = require('async-mutex')
const jwt = require('jsonwebtoken')

const localLogger = {
  debug: (message) =>
    logger.debug({
      component: 'helper',
      context: message.context,
      message: message.message
    }),
  error: (message) =>
    logger.error({
      component: 'helper',
      context: message.context,
      message: message.message
    }),
  info: (message) =>
    logger.info({
      component: 'helper',
      context: message.context,
      message: message.message
    })
}

const m2mAuth = require('tc-core-library-js').auth.m2m

const m2m = m2mAuth(
  _.pick(config, [
    'AUTH0_URL',
    'AUTH0_AUDIENCE',
    'AUTH0_CLIENT_ID',
    'AUTH0_CLIENT_SECRET',
    'AUTH0_PROXY_SERVER_URL'
  ])
)

let busApiClient

/**
 * Get bus api client.
 *
 * @returns {Object} the bus api client
 */
function getBusApiClient () {
  if (busApiClient) {
    return busApiClient
  }
  busApiClient = busApi(
    _.pick(config, [
      'AUTH0_URL',
      'AUTH0_AUDIENCE',
      'TOKEN_CACHE_TIME',
      'AUTH0_CLIENT_ID',
      'AUTH0_CLIENT_SECRET',
      'BUSAPI_URL',
      'KAFKA_ERROR_TOPIC',
      'AUTH0_PROXY_SERVER_URL'
    ])
  )
  return busApiClient
}

/**
 * Get the first parameter from cli arguments
 */
function getParamFromCliArgs () {
  const filteredArgs = process.argv.filter((arg) => !arg.includes('--'))

  if (filteredArgs.length > 2) {
    return filteredArgs[2]
  }

  return null
}

/**
 * Prompt the user with a y/n query and call a callback function based on the answer
 * @param {string} promptQuery the query to ask the user
 * @param {function} cb the callback function
 */
async function promptUser (promptQuery, cb) {
  if (process.argv.includes('--force')) {
    await cb()
    return
  }

  const prompt = new Confirm(promptQuery)
  prompt.ask(async (answer) => {
    if (answer) {
      await cb()
    }
  })
}

/**
 * Sleep for a given number of milliseconds.
 *
 * @param {Number} milliseconds the sleep time
 * @returns {undefined}
 */
async function sleep (milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

/**
 * Import data from a json file into the database
 * @param {string} pathToFile the path to the json file
 * @param {Array} dataModels the data models to import
 * @param {Object} logger the logger object
 */
async function importData (pathToFile, dataModels, logger) {
  // check if file exists
  if (!fs.existsSync(pathToFile)) {
    throw new Error(`File with path ${pathToFile} does not exist`)
  }

  // clear database
  logger.info({ component: 'importData', message: 'Clearing database...' })
  await models.sequelize.sync({ force: true })

  let transaction = null
  let currentModelName = null
  try {
    // Start a transaction
    transaction = await models.sequelize.transaction()
    const jsonData = JSON.parse(fs.readFileSync(pathToFile).toString())

    for (let index = 0; index < dataModels.length; index += 1) {
      const modelOpts = dataModels[index]
      const modelName = _.isString(modelOpts) ? modelOpts : modelOpts.modelName
      const include = _.get(modelOpts, 'include', [])

      currentModelName = modelName
      const model = models[modelName]
      const modelRecords = jsonData[modelName]

      if (modelRecords && modelRecords.length > 0) {
        logger.info({
          component: 'importData',
          message: `Importing data for model: ${modelName}`
        })

        await model.bulkCreate(modelRecords, { include, transaction })
        logger.info({
          component: 'importData',
          message: `Records imported for model: ${modelName} = ${modelRecords.length}`
        })
      } else {
        logger.info({
          component: 'importData',
          message: `No records to import for model: ${modelName}`
        })
      }
    }
    // commit transaction only if all things went ok
    logger.info({
      component: 'importData',
      message: 'committing transaction to database...'
    })
    await transaction.commit()
  } catch (error) {
    logger.error({
      component: 'importData',
      message: `Error while writing data of model: ${currentModelName}`
    })
    // rollback all insert operations
    if (transaction) {
      logger.info({
        component: 'importData',
        message: 'rollback database transaction...'
      })
      transaction.rollback()
    }
    if (error.name && error.errors && error.fields) {
      // For sequelize validation errors, we throw only fields with data that helps in debugging error,
      // because the error object has many fields that contains very big sql query for the insert bulk operation
      throw new Error(
        JSON.stringify({
          modelName: currentModelName,
          name: error.name,
          errors: error.errors,
          fields: error.fields
        })
      )
    } else {
      throw error
    }
  }
}

/**
 * Export data from the database into a json file
 * @param {string} pathToFile the path to the json file
 * @param {Array} dataModels the data models to export
 * @param {Object} logger the logger object
 */
async function exportData (pathToFile, dataModels, logger) {
  logger.info({
    component: 'exportData',
    message: `Start Saving data to file with path ${pathToFile}....`
  })

  const allModelsRecords = {}
  for (let index = 0; index < dataModels.length; index += 1) {
    const modelOpts = dataModels[index]
    const modelName = _.isString(modelOpts) ? modelOpts : modelOpts.modelName
    const include = _.get(modelOpts, 'include', [])
    const modelRecords = await models[modelName].findAll({ include })
    const rawRecords = _.map(modelRecords, (r) => r.toJSON())
    allModelsRecords[modelName] = rawRecords
    logger.info({
      component: 'exportData',
      message: `Records loaded for model: ${modelName} = ${rawRecords.length}`
    })
  }

  fs.writeFileSync(pathToFile, JSON.stringify(allModelsRecords))
  logger.info({
    component: 'exportData',
    message: 'End Saving data to file....'
  })
}

/**
 * Check if exists.
 *
 * @param {Array} source the array in which to search for the term
 * @param {Array | String} term the term to search
 */
function checkIfExists (source, term) {
  let terms

  if (!_.isArray(source)) {
    throw new Error('Source argument should be an array')
  }

  source = source.map((s) => s.toLowerCase())

  if (_.isString(term)) {
    terms = term.toLowerCase().split(' ')
  } else if (_.isArray(term)) {
    terms = term.map((t) => t.toLowerCase())
  } else {
    throw new Error('Term argument should be either a string or an array')
  }

  for (let i = 0; i < terms.length; i++) {
    if (source.includes(terms[i])) {
      return true
    }
  }

  return false
}

/**
 * Wrap async function to standard express function
 * @param {Function} fn the async function
 * @returns {Function} the wrapped function
 */
function wrapExpress (fn) {
  return function (req, res, next) {
    fn(req, res, next).catch(next)
  }
}

/**
 * Wrap all functions from object
 * @param obj the object (controller exports)
 * @returns {Object|Array} the wrapped object
 */
function autoWrapExpress (obj) {
  if (_.isArray(obj)) {
    return obj.map(autoWrapExpress)
  }
  if (_.isFunction(obj)) {
    if (obj.constructor.name === 'AsyncFunction') {
      return wrapExpress(obj)
    }
    return obj
  }
  _.each(obj, (value, key) => {
    obj[key] = autoWrapExpress(value)
  })
  return obj
}

/**
 * Get link for a given page.
 * @param {Object} req the HTTP request
 * @param {Number} page the page number
 * @returns {String} link for the page
 */
function getPageLink (req, page) {
  const q = _.assignIn({}, req.query, { page })
  return `${req.protocol}://${req.get('Host')}${req.baseUrl}${
    req.path
  }?${querystring.stringify(q)}`
}

/**
 * Set HTTP response headers from result.
 * @param {Object} req the HTTP request
 * @param {Object} res the HTTP response
 * @param {Object} result the operation result
 */
function setResHeaders (req, res, result) {
  const totalPages = Math.ceil(result.total / result.perPage)
  if (result.page > 1) {
    res.set('X-Prev-Page', result.page - 1)
  }
  if (result.page < totalPages) {
    res.set('X-Next-Page', result.page + 1)
  }
  res.set('X-Page', result.page)
  res.set('X-Per-Page', result.perPage)
  res.set('X-Total', result.total)
  res.set('X-Total-Pages', totalPages)
  res.set('X-Data-Source', result.fromDb ? 'database' : 'elasticsearch')
  // set Link header
  if (totalPages > 0) {
    let link = `<${getPageLink(req, 1)}>; rel="first", <${getPageLink(
      req,
      totalPages
    )}>; rel="last"`
    if (result.page > 1) {
      link += `, <${getPageLink(req, result.page - 1)}>; rel="prev"`
    }
    if (result.page < totalPages) {
      link += `, <${getPageLink(req, result.page + 1)}>; rel="next"`
    }
    res.set('Link', link)
  }
}

/*
 * Function to get M2M token
 * @returns {Promise}
 */
const getM2MToken = async () => {
  return await m2m.getMachineToken(
    config.AUTH0_CLIENT_ID,
    config.AUTH0_CLIENT_SECRET
  )
}

/**
 * Function to encode query string
 * @param {Object} queryObj the query object
 * @param {String} nesting the nesting string
 * @returns {String} query string
 */
function encodeQueryString (queryObj, nesting = '') {
  const pairs = Object.entries(queryObj).map(([key, val]) => {
    // Handle the nested, recursive case, where the value to encode is an object itself
    if (typeof val === 'object') {
      return encodeQueryString(val, nesting + `${key}.`)
    } else {
      // Handle base case, where the value to encode is simply a string.
      return [nesting + key, val].map(querystring.escape).join('=')
    }
  })
  return pairs.join('&')
}

/**
 * Send Kafka event message
 * @params {String} topic the topic name
 * @params {Object} payload the payload
 * @params {Object} options the extra options to control the function
 */
async function postEvent (topic, payload, options = {}) {
  logger.debug({
    component: 'helper',
    context: 'postEvent',
    message: `Posting event to Kafka topic ${topic}, ${JSON.stringify(
      payload
    )}`
  })
  const client = getBusApiClient()
  const message = {
    topic,
    originator: config.KAFKA_MESSAGE_ORIGINATOR,
    timestamp: new Date().toISOString(),
    'mime-type': 'application/json',
    payload
  }
  if (options.key) {
    message.key = options.key
  }
  await client.postEvent(message)
  await eventDispatcher.handleEvent(topic, { value: payload, options })
}

/**
 * Send error event to Kafka
 * @params {String} topic the topic name
 * @params {Object} payload the payload
 * @params {String} action for which operation error occurred
 */
async function postErrorEvent (topic, payload, action) {
  _.set(payload, 'apiAction', action)
  const client = getBusApiClient()
  const message = {
    topic,
    originator: config.KAFKA_MESSAGE_ORIGINATOR,
    timestamp: new Date().toISOString(),
    'mime-type': 'application/json',
    payload
  }
  logger.debug(`Publish error to Kafka topic ${topic}, ${JSON.stringify(message)}`)
  await client.postEvent(message)
}

/**
 * Function to get projects
 * @param {Object} currentUser the user who perform this operation
 * @param {Object} criteria the search criteria
 * @returns the request result
 */
async function getProjects (currentUser, criteria = {}) {
  let token
  if (currentUser.hasManagePermission || currentUser.isMachine) {
    const m2mToken = await getM2MToken()
    token = `Bearer ${m2mToken}`
  } else {
    token = currentUser.jwtToken
  }
  const url = `${config.TC_API}/projects?type=talent-as-a-service`
  const res = await request
    .get(url)
    .query(criteria)
    .set('Authorization', token)
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
  localLogger.debug({
    context: 'getProjects',
    message: `response body: ${JSON.stringify(res.body)}`
  })
  const result = _.map(res.body, (item) => {
    return _.extend(_.pick(item, ['id', 'invites', 'members']), { name: _.unescape(item.name) })
  })
  return {
    total: Number(_.get(res.headers, 'x-total')),
    page: Number(_.get(res.headers, 'x-page')),
    perPage: Number(_.get(res.headers, 'x-per-page')),
    result
  }
}

/**
 * Function to get members
 * @param {Array} handles the handle array
 * @returns the request result
 */
async function getMembers (handles) {
  const token = await getM2MToken()
  const handlesStr = _.map(handles, (handle) => {
    return '%22' + handle.toLowerCase() + '%22'
  }).join(',')
  const url = `${config.TC_API}/members?fields=userId,handleLower,photoURL&handlesLower=[${handlesStr}]`

  const res = await request
    .get(url)
    .set('Authorization', `Bearer ${token}`)
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
  localLogger.debug({
    context: 'getMembers',
    message: `response body: ${JSON.stringify(res.body)}`
  })
  return res.body
}

/**
 * Function to get project by id
 * @param {Object} currentUser the user who perform this operation
 * @param {Number} id project id
 * @returns the request result
 */
async function getProjectById (currentUser, id) {
  let token
  if (currentUser.hasManagePermission || currentUser.isMachine) {
    const m2mToken = await getM2MToken()
    token = `Bearer ${m2mToken}`
  } else {
    token = currentUser.jwtToken
  }
  const url = `${config.TC_API}/projects/${id}`
  try {
    const res = await request
      .get(url)
      .set('Authorization', token)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
    localLogger.debug({
      context: 'getProjectById',
      message: `response body: ${JSON.stringify(res.body)}`
    })
    return _.extend(_.pick(res.body, ['id', 'invites', 'members']), { name: _.unescape(res.body.name) })
  } catch (err) {
    if (err.status === HttpStatus.FORBIDDEN) {
      throw new errors.ForbiddenError(
        `You are not allowed to access the project with id ${id}`
      )
    }
    if (err.status === HttpStatus.NOT_FOUND) {
      throw new errors.NotFoundError(`id: ${id} project not found`)
    }
    throw err
  }
}

/**
 * Function to search skills from v5/skills
 * - only returns skills from Topcoder Skills API defined by `TOPCODER_TAXONOMY_ID`
 *
 * @param {Object} criteria the search criteria
 * @returns the request result
 */
async function getTopcoderSkills (criteria) {
  const token = await getM2MToken()
  try {
    const res = await request
      .get(`${config.TC_API}/skills`)
      .query({
        taxonomyId: config.TOPCODER_TAXONOMY_ID,
        ...criteria
      })
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
    localLogger.debug({
      context: 'getTopcoderSkills',
      message: `response body: ${JSON.stringify(res.body)}`
    })
    return {
      total: Number(_.get(res.headers, 'x-total')),
      page: Number(_.get(res.headers, 'x-page')),
      perPage: Number(_.get(res.headers, 'x-per-page')),
      result: res.body
    }
  } catch (err) {
    if (err.status === HttpStatus.BAD_REQUEST) {
      throw new errors.BadRequestError(err.response.body.message)
    }
    throw err
  }
}

/**
 * Function to search and retrive all skills from v5/skills
 * - only returns skills from Topcoder Skills API defined by `TOPCODER_TAXONOMY_ID`
 *
 * @param {Object} criteria the search criteria
 * @returns the request result
 */
async function getAllTopcoderSkills (criteria) {
  const skills = await getTopcoderSkills(_.assign(criteria, { page: 1, perPage: 100 }))
  while (skills.page * skills.perPage <= skills.total) {
    const newSkills = await getTopcoderSkills(_.assign(criteria, { page: skills.page + 1, perPage: 100 }))
    skills.result = [...skills.result, ...newSkills.result]
    skills.page = newSkills.page
    skills.total = newSkills.total
  }
  return skills.result
}

/**
 * Function to get skill by id
 * @param {String} skillId the skill Id
 * @returns the request result
 */
async function getSkillById (skillId) {
  const token = await getM2MToken()
  localLogger.debug({
    context: 'getSkillById',
    message: `M2M Token: ${token}`
  })
  const res = await request
    .get(`${config.TC_API}/standardized-skills/skills/${skillId}`)
    .set('Authorization', `Bearer ${token}`)
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
  localLogger.debug({
    context: 'getSkillById',
    message: `response body: ${JSON.stringify(res.body)}`
  })
  return _.pick(res.body, ['id', 'name'])
}

/**
 * Function to get skills by their exact name, via the standarized skills API
 * Used in the job service to validate skill names passed in when creating / updating
 * jobs
 * @param {Array<String>} names - the skill name
 * @returns the request result
 */
async function getSkillsByExactNames (names) {
  if (!names || !_.isArray(names) || !names.length) {
    return []
  }

  const token = await getM2MToken()
  localLogger.debug({
    context: 'getSkillsByNames',
    message: `M2M Token: ${token}`
  })

  const url = `${config.TC_API}/standardized-skills/skills?${names.map(skill => `name=${encodeURIComponent(skill)}`).join('&')}`
  const res = await request
    .get(url)
    .set('Authorization', `Bearer ${token}`)
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')

  localLogger.debug({
    context: 'getSkillsByNames',
    message: `response body of GET ${url} is ${JSON.stringify(res.body)}`
  })

  return res.body
}

/**
 * Ensure job with specific id exists.
 *
 * @param {String} jobId the job id
 * @returns {Object} the job data
 */
async function ensureJobById (jobId) {
  return models.Job.findById(jobId)
}

/**
 * Ensure resource booking with specific id exists.
 *
 * @param {String} resourceBookingId the resourceBooking id
 * @returns {Object} the resourceBooking data
 */
async function ensureResourceBookingById (resourceBookingId) {
  return models.ResourceBooking.findById(resourceBookingId)
}

/**
 * Ensure work period with specific id exists.
 * @param {String} workPeriodId the workPeriod id
 * @returns the workPeriod data
 */
async function ensureWorkPeriodById (workPeriodId) {
  return models.WorkPeriod.findById(workPeriodId)
}

/**
 * Generate M2M auth user.
 *
 * @returns {Object} the M2M auth user
 */
function getAuditM2Muser () {
  return {
    isMachine: true,
    userId: config.m2m.M2M_AUDIT_USER_ID,
    handle: config.m2m.M2M_AUDIT_HANDLE
  }
}

/**
 * Function to check whether a user is a member of a project
 * by first retrieving the project detail via /v5/projects/:projectId and
 * then checking whether the user was included in the `members` property of the project detail object.
 *
 * @param {Object} userId the id of the user
 * @param {Number} projectId project id
 * @returns the result
 */
async function checkIsMemberOfProject (userId, projectId) {
  const m2mToken = await getM2MToken()
  const res = await request
    .get(`${config.TC_API}/projects/${projectId}`)
    .set('Authorization', `Bearer ${m2mToken}`)
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
  const memberIdList = _.map(res.body.members, 'userId')
  localLogger.debug({
    context: 'checkIsMemberOfProject',
    message: `the members of project ${projectId}: ${JSON.stringify(
      memberIdList
    )}, authUserId: ${JSON.stringify(userId)}`
  })
  if (!memberIdList.includes(userId)) {
    throw new errors.UnauthorizedError(
      `userId: ${userId} the user is not a member of project ${projectId}`
    )
  }
}

/**
 * Find topcoder members by handles.
 *
 * @param {Array} handles the array of handles
 * @returns {Array} the member details
 */
async function getMemberDetailsByHandles (handles) {
  if (!handles.length) {
    return []
  }
  const token = await getM2MToken()
  const res = await request
    .get(`${config.TOPCODER_MEMBERS_API}/`)
    .query({
      'handlesLower[]': handles.map(handle => handle.toLowerCase()),
      fields: 'userId,handle,handleLower,firstName,lastName,email'
    })
    .set('Authorization', `Bearer ${token}`)
    .set('Accept', 'application/json')
  localLogger.debug({
    context: 'getMemberDetailsByHandles',
    message: `response body: ${JSON.stringify(res.body)}`
  })
  return res.body
}

/**
 * Get topcoder member details by handle.
 *
 * @param {String} handle the user handle
 * @returns {Object} the member details
 */
async function getMemberDetailsByHandle (handle) {
  const [memberDetails] = await getMemberDetailsByHandles([handle])

  if (!memberDetails) {
    throw new errors.NotFoundError(`Member details are not found by handle "${handle}".`)
  }

  return memberDetails
}

/**
 * Find topcoder members by email.
 *
 * @param {String} token the auth token
 * @param {String} email the email
 * @returns {Array} the member details
 */
async function _getMemberDetailsByEmail (token, email) {
  const res = await request
    .get(config.TOPCODER_USERS_API)
    .query({
      filter: `email=${email}`,
      fields: 'handle,id,email,firstName,lastName'
    })
    .set('Authorization', `Bearer ${token}`)
    .set('Accept', 'application/json')
  localLogger.debug({
    context: '_getMemberDetailsByEmail',
    message: `response body: ${JSON.stringify(res.body)}`
  })
  return _.get(res.body, 'result.content')
}

/**
 * Find topcoder members by emails.
 * Maximum concurrent requests is limited by MAX_PARALLEL_REQUEST_TOPCODER_USERS_API.
 *
 * @param {Array} emails the array of emails
 * @returns {Array} the member details
 */
async function getMemberDetailsByEmails (emails) {
  const token = await getM2MToken()
  const limiter = new Bottleneck({
    maxConcurrent: config.MAX_PARALLEL_REQUEST_TOPCODER_USERS_API
  })
  const membersArray = await Promise.all(
    emails.map((email) =>
      limiter.schedule(() =>
        _getMemberDetailsByEmail(token, email).catch((error) => {
          localLogger.error({
            context: 'getMemberDetailsByEmails',
            message: error.message
          })
          return []
        })
      )
    )
  )
  return _.flatten(membersArray)
}

/**
 * Add a member to a project.
 *
 * @param {Number} projectId project id
 * @param {Object} data the userId and the role of the member
 * @param {Object} criteria the filtering criteria
 * @returns {Object} the member created
 */
async function createProjectMember (projectId, data, criteria) {
  const m2mToken = await getM2MToken()
  const { body: member } = await request
    .post(`${config.TC_API}/projects/${projectId}/members`)
    .set('Authorization', `Bearer ${m2mToken}`)
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
    .query(criteria)
    .send(data)
  localLogger.debug({
    context: 'createProjectMember',
    message: `response body: ${JSON.stringify(member)}`
  })
  return member
}

/**
 * List members of a project.
 * @param {Object} currentUser the user who perform this operation
 * @param {String} projectId the project id
 * @param {Object} criteria the search criteria
 * @returns {Array} the project members
 */
async function listProjectMembers (currentUser, projectId, criteria = {}) {
  const token =
    currentUser.hasManagePermission || currentUser.isMachine
      ? `Bearer ${await getM2MToken()}`
      : currentUser.jwtToken
  const { body: members } = await request
    .get(`${config.TC_API}/projects/${projectId}/members`)
    .query(criteria)
    .set('Authorization', token)
    .set('Accept', 'application/json')
  localLogger.debug({
    context: 'listProjectMembers',
    message: `response body: ${JSON.stringify(members)}`
  })
  return members
}

/**
 * List member invites of a project.
 * @param {Object} currentUser the user who perform this operation
 * @param {String} projectId the project id
 * @param {Object} criteria the search criteria
 * @returns {Array} the member invites
 */
async function listProjectMemberInvites (currentUser, projectId, criteria = {}) {
  const token =
    currentUser.hasManagePermission || currentUser.isMachine
      ? `Bearer ${await getM2MToken()}`
      : currentUser.jwtToken
  const { body: invites } = await request
    .get(`${config.TC_API}/projects/${projectId}/invites`)
    .query(criteria)
    .set('Authorization', token)
    .set('Accept', 'application/json')
  localLogger.debug({
    context: 'listProjectMemberInvites',
    message: `response body: ${JSON.stringify(invites)}`
  })
  return invites
}

/**
 * Remove a member from a project.
 * @param {Object} currentUser the user who perform this operation
 * @param {String} projectId the project id
 * @param {String} projectMemberId the id of the project member
 * @returns {undefined}
 */
async function deleteProjectMember (currentUser, projectId, projectMemberId) {
  const token =
    currentUser.hasManagePermission || currentUser.isMachine
      ? `Bearer ${await getM2MToken()}`
      : currentUser.jwtToken
  try {
    await request
      .delete(
        `${config.TC_API}/projects/${projectId}/members/${projectMemberId}`
      )
      .set('Authorization', token)
  } catch (err) {
    if (err.status === HttpStatus.NOT_FOUND) {
      throw new errors.NotFoundError(
        `projectMemberId: ${projectMemberId} "member" doesn't exist in project ${projectId}`
      )
    }
    throw err
  }
}

/**
 * Gets requested attribute value from user's attributes array.
 * @param {Object} user The enriched (i.e. includes attributes) user object from users API. (check getUserById functions)
 * @param {String} attributeName Requested attribute name, e.g. "email"
 * @returns attribute value
 */
function getUserAttributeValue (user, attributeName) {
  const attributes = _.get(user, 'attributes', [])
  const targetAttribute = _.find(
    attributes,
    (a) => a.attribute.name === attributeName
  )
  return _.get(targetAttribute, 'value')
}

/**
 * Create a new challenge
 *
 * @param {Object} data challenge data
 * @param {String} token m2m token
 * @returns {Object} the challenge created
 */
async function createChallenge (data, token) {
  if (!token) {
    token = await getM2MToken()
  }
  const url = `${config.TC_API}/challenges`
  localLogger.debug({
    context: 'createChallenge',
    message: `EndPoint: POST ${url}`
  })
  localLogger.debug({
    context: 'createChallenge',
    message: `Request Body: ${JSON.stringify(data)}`
  })
  const { body: challenge, status: httpStatus } = await request
    .post(url)
    .set('Authorization', `Bearer ${token}`)
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
    .send(data)
  localLogger.debug({
    context: 'createChallenge',
    message: `Status Code: ${httpStatus}`
  })
  localLogger.debug({
    context: 'createChallenge',
    message: `Response Body: ${JSON.stringify(challenge)}`
  })
  return challenge
}

/**
 * Get a challenge
 *
 * @param {Object} data challenge data
 * @returns {Object} the challenge
 */
async function getChallenge (challengeId) {
  const token = await getM2MToken()
  const url = `${config.TC_API}/challenges/${challengeId}`
  localLogger.debug({ context: 'getChallenge', message: `EndPoint: GET ${url}` })
  const { body: challenge, status: httpStatus } = await request
    .get(url)
    .set('Authorization', `Bearer ${token}`)
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
  localLogger.debug({ context: 'getChallenge', message: `Status Code: ${httpStatus}` })
  localLogger.debug({ context: 'getChallenge', message: `Response Body: ${JSON.stringify(challenge)}` })
  return challenge
}

/**
 * Update a challenge
 *
 * @param {String} challengeId id of the challenge
 * @param {Object} data challenge data
 * @param {String} token m2m token
 * @returns {Object} the challenge updated
 */
async function updateChallenge (challengeId, data, token) {
  if (!token) {
    token = await getM2MToken()
  }
  const url = `${config.TC_API}/challenges/${challengeId}`
  localLogger.debug({
    context: 'updateChallenge',
    message: `EndPoint: PATCH ${url}`
  })
  localLogger.debug({
    context: 'updateChallenge',
    message: `Request Body: ${JSON.stringify(data)}`
  })
  const { body: challenge, status: httpStatus } = await request
    .patch(url)
    .set('Authorization', `Bearer ${token}`)
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
    .send(data)
  localLogger.debug({
    context: 'updateChallenge',
    message: `Status Code: ${httpStatus}`
  })
  localLogger.debug({
    context: 'updateChallenge',
    message: `Response Body: ${JSON.stringify(challenge)}`
  })
  return challenge
}

/**
 * Create a challenge resource
 *
 * @param {Object} data resource
 * @param {String} token m2m token
 * @returns {Object} the resource created
 */
async function createChallengeResource (data, token) {
  if (!token) {
    token = await getM2MToken()
  }
  const url = `${config.TC_API}/resources`
  localLogger.debug({
    context: 'createChallengeResource',
    message: `EndPoint: POST ${url}`
  })
  localLogger.debug({
    context: 'createChallengeResource',
    message: `Request Body: ${JSON.stringify(data)}`
  })
  const { body: resource, status: httpStatus } = await request
    .post(url)
    .set('Authorization', `Bearer ${token}`)
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
    .send(data)
  localLogger.debug({
    context: 'createChallengeResource',
    message: `Status Code: ${httpStatus}`
  })
  localLogger.debug({
    context: 'createChallengeResource',
    message: `Response Body: ${JSON.stringify(resource)}`
  })
  return resource
}

/**
 *
 * @param {String} challengeId the challenge id
 * @param {String} memberHandle the member handle
 * @param {String} roleId the role id
 * @returns {Object} the resource
 */
async function getChallengeResource (challengeId, memberHandle, roleId) {
  const token = await getM2MToken()
  const url = `${config.TC_API}/resources?challengeId=${challengeId}&memberHandle=${memberHandle}&roleId=${roleId}`
  localLogger.debug({ context: 'createChallengeResource', message: `EndPoint: POST ${url}` })
  try {
    const { body: resource, status: httpStatus } = await request
      .get(url)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
    localLogger.debug({ context: 'getChallengeResource', message: `Status Code: ${httpStatus}` })
    localLogger.debug({ context: 'getChallengeResource', message: `Response Body: ${JSON.stringify(resource)}` })
    return resource[0]
  } catch (err) {
    if (err.status === 404) {
      localLogger.debug({ context: 'getChallengeResource', message: `Status Code: ${err.status}` })
    } else {
      throw err
    }
  }
}

/**
 * Populates workPeriods from start and end date of resource booking
 * @param {Date} start start date of the resource booking
 * @param {Date} end end date of the resource booking
 * @returns {Array<{startDate:Date, endDate:Date, daysWorked:number}>} information about workPeriods
 */
function extractWorkPeriods (start, end) {
  // calculate maximum possible daysWorked for a week
  function getDaysWorked (week) {
    if (weeks === 1) {
      return Math.min(endDay, 5) - Math.max(startDay, 1) + 1
    } else if (week === 0) {
      return Math.min(6 - startDay, 5)
    } else if (week === weeks - 1) {
      return Math.min(endDay, 5)
    } else return 5
  }
  const periods = []
  if (_.isNil(start) || _.isNil(end)) {
    return periods
  }
  const startDate = moment(start)
  const startDay = startDate.get('day')
  startDate.set('day', 0).startOf('day')

  const endDate = moment(end)
  const endDay = endDate.get('day')
  endDate.set('day', 6).endOf('day')

  const weeks = Math.round(moment.duration(endDate - startDate).asDays()) / 7

  for (let i = 0; i < weeks; i++) {
    periods.push({
      startDate: startDate.format('YYYY-MM-DD'),
      endDate: startDate.add(6, 'day').format('YYYY-MM-DD'),
      daysWorked: getDaysWorked(i)
    })
    startDate.add(1, 'day')
  }
  return periods
}

/**
 * Calculate the payment status of given workPeriod
 * @param {object} workPeriod workPeriod object with payments
 * @returns {string} new workperiod payment status
 * @throws {ConflictError} when no rule matches
 */
function calculateWorkPeriodPaymentStatus (workPeriod) {
  function matchRule (rule) {
    const actualState = {
      daysWorked: workPeriod.daysWorked,
      hasDueDays: workPeriod.daysWorked > workPeriod.daysPaid
    }
    return _.every(_.keys(rule.condition), condition => {
      if (_.isArray(rule.condition[condition])) {
        return checkIfExists(_.map(workPeriod.payments, 'status'), rule.condition[condition])
      } else {
        return rule.condition[condition] === actualState[condition]
      }
    })
  }
  // find the first rule which is matched by the Work Period
  for (const rule of PaymentStatusRules) {
    if (matchRule(rule)) {
      return rule.paymentStatus
    }
  }
  throw new errors.ConflictError('Cannot calculate payment status.')
}

/**
 * Returns the email address of specified (via handle) user.
 *
 * @param {String} userHandle user handle
 * @returns {String} email address of the user
 */
async function getUserByHandle (userHandle) {
  const token = await getM2MToken()
  const url = `${config.TC_API}/members/${userHandle}`
  const res = await request
    .get(url)
    .set('Authorization', `Bearer ${token}`)
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
  localLogger.debug({
    context: 'getUserByHandle',
    message: `response body: ${JSON.stringify(res.body)}`
  })
  return _.get(res, 'body')
}

/**
 *
 * @param {String} string that will be modifed
 * @param {*} object of json that would be replaced in string
 * @returns
 */
function substituteStringByObject (string, object) {
  for (var key in object) {
    if (!Object.prototype.hasOwnProperty.call(object, key)) {
      continue
    }
    string = string.replace(new RegExp('{{' + key + '}}', 'g'), object[key])
  }
  return string
}

/**
 * Get tags from tagging service
 * @param {String} description The challenge description
 * @returns {Array} array of tags
 */
async function getTags (description) {
  const data = { text: description, extract_confidence: false }
  const type = 'emsi/internal_no_refresh'
  const url = `${config.TC_API}/contest-tagging/${type}`
  const res = await request
    .post(url)
    .set('Accept', 'application/json')
    .send(querystring.stringify(data))

  localLogger.debug({
    context: 'getTags',
    message: `response body: ${JSON.stringify(res.body)}`
  })
  return _.get(res, 'body')
}

/**
 * @param {Object} data title of project and any other info
 * @returns {Object} the project created
 */
async function createProject (currentUser, data) {
  const token = currentUser.jwtToken
  const res = await request
    .post(`${config.TC_API}/projects/`)
    .set('Authorization', token)
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
    .send(data)
  localLogger.debug({
    context: 'createProject',
    message: `response body: ${JSON.stringify(res)}`
  })
  const result = _.get(res, 'body')
  return _.extend(result, { name: _.unescape(_.get(result, 'name')) })
}

/**
 * Returns the email address of specified (via handle) user.
 *
 * @param {String} userHandle user handle
 * @returns {String} email address of the user
 */
async function getMemberGroups (userId) {
  const token = await getM2MToken()
  const url = `${config.TC_API}/groups/memberGroups/${userId}`
  const res = await request
    .get(url)
    .set('Authorization', `Bearer ${token}`)
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
  localLogger.debug({
    context: 'getMemberGroups',
    message: `response body: ${JSON.stringify(res.body)}`
  })
  return _.get(res, 'body')
}

/**
 * Removes markdown and html formatting from given text
 *
 * @param {String} text formatted text
 * @returns {String} cleaned words seperated by single space
 */
function removeTextFormatting (text) {
  text = _.replace(text, /^(-\s*?|\*\s*?|_\s*?){3,}\s*$/gm, ' ')
  text = _.replace(text, /^([\s\t]*)([*\-+]|\d+\.)\s+/gm, ' $1 ')
  // Header
  text = _.replace(text, /\n={2,}/g, '\n')
  // Fenced codeblocks
  text = _.replace(text, /~{3}.*\n/g, ' ')
  // Strikethrough
  text = _.replace(text, /~~/g, ' ')
  // Fenced codeblocks
  text = _.replace(text, /`{3}.*\n/g, ' ')
  // Remove HTML tags
  text = _.replace(text, /<[^>]*>/g, ' ')
  // Remove setext-style headers
  text = _.replace(text, /^[=-]{2,}\s*$/g, ' ')
  // Remove footnotes
  text = _.replace(text, /\[\^.+?\](: .*?$)?/g, ' ')
  text = _.replace(text, /\s{0,2}\[.*?\]: .*?$/g, ' ')
  // Remove images and keep description unless it is default description "image"
  text = _.replace(text, /!(\[((?!image).*?)\]|\[.*?\])[[(].*?[\])]/g, ' $2 ')
  // Remove inline links
  text = _.replace(text, /\[(.*?)\][[(].*?[\])]/g, ' $1 ')
  // Remove blockquotes
  text = _.replace(text, /^\s{0,3}>\s?/g, ' ')
  // Remove reference-style links
  text = _.replace(text, /^\s{1,2}\[(.*?)\]: (\S+)( ".*?")?\s*$/g, ' ')
  // Remove atx-style headers
  text = _.replace(text, /^#{1,6}\s*([^#]*)\s*#{1,6}?$/gm, ' $1 ')
  // Remove emphasis (repeat the line to remove double emphasis)
  text = _.replace(text, /([*_]{1,3})(\S.*?\S{0,1})\1/g, ' $2 ')
  text = _.replace(text, /([*_]{1,3})(\S.*?\S{0,1})\1/g, ' $2 ')
  // Remove code blocks
  text = _.replace(text, /(`{3,})(.*?)\1/gm, ' $2 ')
  // Remove inline code
  text = _.replace(text, /`(.+?)`/g, ' $1 ')
  // Remove punctuation
  text = _.replace(text, /[,"'?/\\]/g, ' ')
  // Replace two or more newlines
  text = _.replace(text, /\n/g, ' ')
  // Replace non-breaking space with regular space
  text = _.replace(text, /\xA0/g, ' ')
  // replace all whitespace characters with single space
  text = _.replace(text, /\s\s+/g, ' ')
  return text
}

/**
 * Function to get member suggestions
 * @param {string} fragment the handle fragment
 * @return the request result
 */
async function getMembersSuggest (fragment) {
  const token = await getM2MToken()
  const url = `${config.TOPCODER_MEMBERS_API_V3}/_suggest/${encodeURIComponent(fragment)}`
  const res = await request
    .get(url)
    .set('Authorization', `Bearer ${token}`)
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
  localLogger.debug({
    context: 'getMembersSuggest',
    message: `response body: ${JSON.stringify(res.body)}`
  })
  return res.body
}

/**
 * Function to register job skills with the standardised skills API
 * @param {Object} job the job data, including skills
 * @returns the request result
 */
async function registerSkills (job) {
  const token = await getM2MToken()
  const body = {
    skillIds: job.skills
  }
  localLogger.debug({
    context: 'registerSkills',
    message: `request: ${JSON.stringify(body)}`
  })
  const res = await request
    .post(`${config.TC_API}/standardized-skills/job-skills/${job.id}`)
    .set('Authorization', `Bearer ${token}`)
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
    .send(body)
  localLogger.debug({
    context: 'registerSkills',
    message: `response body: ${JSON.stringify(res.body)}`
  })
  return res.body
}

/**
 * Returns the email templates for given key
 * @param key the type of email template ex: teamTemplates
 * @returns the list of templates for the given key
 */
function getEmailTemplatesForKey (key) {
  if (!_.has(emailTemplateConfig, key)) { return [] }

  return _.mapValues(emailTemplateConfig[key], (template) => {
    return {
      subject: template.subject,
      body: template.body,
      from: template.from,
      recipients: template.recipients,
      cc: template.cc,
      sendgridTemplateId: template.sendgridTemplateId
    }
  })
}

/**
 * Format date and time in EDT timezone
 *
 * @param {Date} date date to be formatted
 * @returns {String} formatted date
 */
function formatDateTimeEDT (date) {
  if (date) {
    return moment(date).tz('America/New_York').format('MMM D, YYYY, HH:mm z')
  }
}

/**
 * Format date
 *
 * @param {Date} date date to be formatted
 * @returns {String} formatted date
 */
function formatDate (date) {
  if (date) {
    return moment(date).format('MMM D, YYYY')
  } else {
    return 'TBD'
  }
}

/**
 * Runs code one by one for interview event handlers.
 *
 * @param {Function} func function to execute
 * @returns Promise
 */
const interviewsWebhookMutex = withTimeout(new Mutex(), InterviewEventHandlerTimeout)
async function runExclusiveInterviewEventHandler (func) {
  return interviewsWebhookMutex.runExclusive(func)
}

/**
 * Runs code one by one for calendar webhooks.
 *
 * @param {Function} func function to execute
 * @returns Promise
 */
const calendarWebhookMutex = new Mutex()
async function waitForUnlockCalendarConnectionHandler (func) {
  return calendarWebhookMutex.waitForUnlock().then(func)
}
async function runExclusiveCalendarConnectionHandler (func) {
  return calendarWebhookMutex.runExclusive(func)
}

const namedMutexMap = {}
/**
 * Runs code one by one using mutex.
 *
 * @param {String|Number} mutexName mutex name
 * @param {Function} func function to execute
 * @returns {Promise<any>}
 */
async function runExclusiveByNamedMutex (mutexName, func) {
  // mutex name should be either string or number
  if (!(_.isString(mutexName) || _.isNumber(mutexName))) {
    throw new Error('Mutex name has to be provided.')
  }

  if (!_.isFunction(func)) {
    throw new Error('Mutex callback function has to be provided.')
  }

  let namedMutex = namedMutexMap[mutexName]
  if (!namedMutex) {
    namedMutex = new Mutex()
    namedMutexMap[mutexName] = namedMutex
  }

  return namedMutex.runExclusive(func)
}

/**
 * Sign zoom link.
 *
 * @param {Object} data the object to sign
 * @returns token
 */
function signZoomLink (data) {
  return jwt.sign(
    data,
    config.ZOOM_LINK_SECRET,
    {
      algorithm: 'HS256',
      expiresIn: config.ZOOM_LINK_TOKEN_EXPIRY
    }
  )
}

/**
 * Verify zoom link request token.
 *
 * @param {String} token the token to verify
 * @returns data if token is valid
 */
function verifyZoomLinkToken (token) {
  try {
    return jwt.verify(token, config.ZOOM_LINK_SECRET)
  } catch (e) {
    throw new errors.UnauthorizedError(`token invalid: ${e.message}`)
  }
}

/**
 * Check if the user id (Number) exists in member-api
 * If it exists return it, otherwise throw en error
 * @param {number} userId - The Topcoder userId to check
 */
async function ensureTopcoderUserIdExists (userId, enrich = false) {
  const token = await getM2MToken()
  const url = `${config.TOPCODER_MEMBERS_API}?userId=${userId}`
  const res = await request
    .get(url)
    .set('Authorization', `Bearer ${token}`)
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
  localLogger.debug({
    context: 'ensureTopcoderUserIdExists',
    message: `response body: ${JSON.stringify(res.body)}`
  })
  if (res.body.length === 0) {
    throw new errors.NotFoundError(
      `userId: ${userId} "user" not found from ${config.TOPCODER_MEMBERS_API}`
    )
  }
  const user = res.body[0]
  // fetch user skills when enrichement is required
  if (enrich) {
    const skillsResponse = await request.get(`${config.TC_API}/standardized-skills/user-skills/${userId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
    user.skills = _.map(skillsResponse.body[0], (skill) => _.pick(skill, ['id', 'name']))
  }
  return user
}

module.exports = {
  encodeQueryString,
  getParamFromCliArgs,
  promptUser,
  sleep,
  importData,
  exportData,
  checkIfExists,
  autoWrapExpress,
  setResHeaders,
  getUserId: async (userId) => {
    return String(userId)
  },
  getM2MToken,
  postEvent,
  postErrorEvent,
  getBusApiClient,
  getProjects,
  getMembers,
  getProjectById,
  getTopcoderSkills,
  getAllTopcoderSkills,
  getSkillById,
  ensureJobById,
  ensureResourceBookingById,
  ensureWorkPeriodById,
  getAuditM2Muser,
  checkIsMemberOfProject,
  getMemberDetailsByHandles,
  getMemberDetailsByHandle,
  getMemberDetailsByEmails,
  getTags,
  createProjectMember,
  listProjectMembers,
  listProjectMemberInvites,
  deleteProjectMember,
  getUserAttributeValue,
  createChallenge,
  getChallenge,
  updateChallenge,
  createChallengeResource,
  getChallengeResource,
  extractWorkPeriods,
  calculateWorkPeriodPaymentStatus,
  getUserByHandle,
  substituteStringByObject,
  createProject,
  getMemberGroups,
  removeTextFormatting,
  getMembersSuggest,
  registerSkills,
  getEmailTemplatesForKey,
  formatDate,
  formatDateTimeEDT,
  runExclusiveCalendarConnectionHandler,
  waitForUnlockCalendarConnectionHandler,
  runExclusiveInterviewEventHandler,
  runExclusiveByNamedMutex,
  signZoomLink,
  verifyZoomLinkToken,
  ensureTopcoderUserIdExists,
  getSkillsByExactNames
}
