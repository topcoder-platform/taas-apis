/**
 * This file defines helper methods
 */

const querystring = require('querystring')
const AWS = require('aws-sdk')
const config = require('config')
const HttpStatus = require('http-status-codes')
const _ = require('lodash')
const request = require('superagent')
const elasticsearch = require('@elastic/elasticsearch')
const errors = require('../common/errors')
const logger = require('./logger')
const models = require('../models')
const eventDispatcher = require('./eventDispatcher')
const busApi = require('@topcoder-platform/topcoder-bus-api-wrapper')

const localLogger = {
  debug: (message) => logger.debug({ component: 'helper', context: message.context, message: message.message })
}

AWS.config.region = config.esConfig.AWS_REGION

const m2mAuth = require('tc-core-library-js').auth.m2m

// const m2m = m2mAuth(_.pick(config, ['AUTH0_URL', 'AUTH0_AUDIENCE', 'TOKEN_CACHE_TIME', 'AUTH0_PROXY_SERVER_URL']))
const m2m = m2mAuth(_.pick(config, ['AUTH0_URL', 'AUTH0_AUDIENCE', 'AUTH0_CLIENT_ID', 'AUTH0_CLIENT_SECRET', 'AUTH0_PROXY_SERVER_URL']))

const topcoderM2M = m2mAuth({
  AUTH0_AUDIENCE: config.AUTH0_AUDIENCE_FOR_BUS_API,
  ..._.pick(config, ['AUTH0_URL', 'TOKEN_CACHE_TIME', 'AUTH0_CLIENT_ID', 'AUTH0_CLIENT_SECRET', 'AUTH0_PROXY_SERVER_URL'])
})

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
  busApiClient = busApi({
    AUTH0_AUDIENCE: config.AUTH0_AUDIENCE_FOR_BUS_API,
    ..._.pick(config, ['AUTH0_URL', 'TOKEN_CACHE_TIME', 'AUTH0_CLIENT_ID', 'AUTH0_CLIENT_SECRET', 'BUSAPI_URL', 'KAFKA_ERROR_TOPIC', 'AUTH0_PROXY_SERVER_URL'])
  })
  return busApiClient
}

// ES Client mapping
const esClients = {}

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

  source = source.map(s => s.toLowerCase())

  if (_.isString(term)) {
    terms = term.toLowerCase().split(' ')
  } else if (_.isArray(term)) {
    terms = term.map(t => t.toLowerCase())
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
  return `${req.protocol}://${req.get('Host')}${req.baseUrl}${req.path}?${querystring.stringify(q)}`
}

/**
 * Set HTTP response headers from result.
 * @param {Object} req the HTTP request
 * @param {Object} res the HTTP response
 * @param {Object} result the operation result
 */
function setResHeaders (req, res, result) {
  if (result.fromDb) {
    return
  }
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
  // set Link header
  if (totalPages > 0) {
    let link = `<${getPageLink(req, 1)}>; rel="first", <${getPageLink(req, totalPages)}>; rel="last"`
    if (result.page > 1) {
      link += `, <${getPageLink(req, result.page - 1)}>; rel="prev"`
    }
    if (result.page < totalPages) {
      link += `, <${getPageLink(req, result.page + 1)}>; rel="next"`
    }
    res.set('Link', link)
  }
}

/**
 * Clear the object, remove all null or empty array field
 * @param {Object|Array} obj the given object
 */
function clearObject (obj) {
  if (_.isNull(obj)) {
    return undefined
  }
  if (_.isArray(obj)) {
    return _.map(obj, e => _.omitBy(e, _.isNull))
  } else {
    return _.omitBy(obj, (p) => { return _.isNull(p) || (_.isArray(p) && _.isEmpty(p)) })
  }
}

/**
 * Get ES Client
 * @return {Object} Elastic Host Client Instance
 */
function getESClient () {
  if (esClients.client) {
    return esClients.client
  }

  const host = config.esConfig.HOST
  const cloudId = config.esConfig.ELASTICCLOUD.id
  if (cloudId) {
    // Elastic Cloud configuration
    esClients.client = new elasticsearch.Client({
      cloud: {
        id: cloudId
      },
      auth: {
        username: config.esConfig.ELASTICCLOUD.username,
        password: config.esConfig.ELASTICCLOUD.password
      }
    })
  } else {
    esClients.client = new elasticsearch.Client({
      node: host
    })
  }
  return esClients.client
}

/*
 * Function to get M2M token
 * @returns {Promise}
 */
const getM2Mtoken = async () => {
  return await m2m.getMachineToken(config.AUTH0_CLIENT_ID, config.AUTH0_CLIENT_SECRET)
}

/*
 * Function to get M2M token to access topcoder resources(e.g. /v3/users)
 * @returns {Promise}
 */
const getTopcoderM2MToken = async () => {
  return await topcoderM2M.getMachineToken(config.AUTH0_CLIENT_ID, config.AUTH0_CLIENT_SECRET)
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
 * Function to get user ids
 * @param {Integer} userId  user id from jwt token
 * @returns {String} user id.
 */
async function getUserIds (userId) {
  const token = await getM2Mtoken()
  const q = {
    enrich: true,
    externalProfile: {
      organizationId: config.ORG_ID,
      externalId: userId
    }
  }
  const url = `${config.TC_API}/users?${encodeQueryString(q)}`
  const res = await request
    .get(url)
    .set('Authorization', `Bearer ${token}`)
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
  localLogger.debug({ context: 'getUserIds', message: `response body: ${JSON.stringify(res.body)}` })
  return res.body
}

/**
 * Function to get user id
 * @param {Integer} userId  user id from jwt token
 * @returns {String} user id.
 */
async function getUserId (userId) {
  const ids = await getUserIds(userId)
  if (_.isEmpty(ids)) {
    throw new errors.NotFoundError(`userId: ${userId} "user" not found`)
  }
  return ids[0].id
}

/**
 * Send Kafka event message
 * @params {String} topic the topic name
 * @params {Object} payload the payload
 * @params {Object} options the extra options to control the function
 */
async function postEvent (topic, payload, options = {}) {
  logger.debug({ component: 'helper', context: 'postEvent', message: `Posting event to Kafka topic ${topic}, ${JSON.stringify(payload)}` })
  const client = getBusApiClient()
  const message = {
    topic,
    originator: config.KAFKA_MESSAGE_ORIGINATOR,
    timestamp: new Date().toISOString(),
    'mime-type': 'application/json',
    payload
  }
  await client.postEvent(message)
  await eventDispatcher.handleEvent(topic, { value: payload, options })
}

/**
 * Test if an error is document missing exception
 *
 * @param {Object} err the err
 * @returns {Boolean} the result
 */
function isDocumentMissingException (err) {
  if (err.statusCode === 404) {
    return true
  }
  return false
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
    const m2mToken = await getM2Mtoken()
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
  localLogger.debug({ context: 'getProjects', message: `response body: ${JSON.stringify(res.body)}` })
  const result = _.map(res.body, item => {
    return _.pick(item, ['id', 'name'])
  })
  return {
    total: Number(_.get(res.headers, 'x-total')),
    page: Number(_.get(res.headers, 'x-page')),
    perPage: Number(_.get(res.headers, 'x-per-page')),
    result
  }
}

/**
 * Get topcoder user by id from /v3/users.
 *
 * @param {String} userId the legacy user id
 * @returns {Object} the user
 */
async function getTopcoderUserById (userId) {
  const token = await getTopcoderM2MToken()
  const res = await request
    .get(config.TOPCODER_USERS_API)
    .query({ filter: `id=${userId}` })
    .set('Authorization', `Bearer ${token}`)
    .set('Accept', 'application/json')
  localLogger.debug({ context: 'getTopcoderUserById', message: `response body: ${JSON.stringify(res.body)}` })
  const user = _.get(res.body, 'result.content[0]')
  if (!user) {
    throw new errors.NotFoundError(`userId: ${userId} "user" not found from ${config.TOPCODER_USERS_API}`)
  }
  return user
}

/**
 * Function to get users
 * @param {String} userId the user id
 * @returns the request result
 */
async function getUserById (userId, enrich) {
  const token = await getM2Mtoken()
  const res = await request
    .get(`${config.TC_API}/users/${userId}` + (enrich ? '?enrich=true' : ''))
    .set('Authorization', `Bearer ${token}`)
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
  localLogger.debug({ context: 'getUserById', message: `response body: ${JSON.stringify(res.body)}` })

  const user = _.pick(res.body, ['id', 'handle', 'firstName', 'lastName'])

  if (enrich) {
    user.skills = (res.body.skills || []).map((skillObj) => _.pick(skillObj.skill, ['id', 'name']))
  }

  return user
}

/**
 * Function to create user in ubhan
 * @param {Object} data the user data
 * @returns the request result
 */
async function createUbhanUser ({ handle, firstName, lastName }) {
  const token = await getM2Mtoken()
  const res = await request
    .post(`${config.TC_API}/users`)
    .set('Authorization', `Bearer ${token}`)
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
    .send({ handle, firstName, lastName })
  localLogger.debug({ context: 'createUbhanUser', message: `response body: ${JSON.stringify(res.body)}` })
  return _.pick(res.body, ['id'])
}

/**
 * Function to create external profile for a ubhan user
 * @param {String} userId the user id(with uuid format)
 * @param {Object} data the profile data
 */
async function createUserExternalProfile (userId, { organizationId, externalId }) {
  const token = await getM2Mtoken()
  const res = await request
    .post(`${config.TC_API}/users/${userId}/externalProfiles`)
    .set('Authorization', `Bearer ${token}`)
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
    .send({ organizationId, externalId: String(externalId) })
  localLogger.debug({ context: 'createUserExternalProfile', message: `response body: ${JSON.stringify(res.body)}` })
}

/**
 * Function to get members
 * @param {Array} handles the handle array
 * @returns the request result
 */
async function getMembers (handles) {
  const token = await getM2Mtoken()
  const handlesStr = _.map(handles, handle => {
    return '%22' + handle.toLowerCase() + '%22'
  }).join(',')
  const url = `${config.TC_API}/members?fields=userId,handleLower,photoURL&handlesLower=[${handlesStr}]`

  const res = await request
    .get(url)
    .set('Authorization', `Bearer ${token}`)
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
  localLogger.debug({ context: 'getMembers', message: `response body: ${JSON.stringify(res.body)}` })
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
    const m2mToken = await getM2Mtoken()
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
    localLogger.debug({ context: 'getProjectById', message: `response body: ${JSON.stringify(res.body)}` })
    return _.pick(res.body, ['id', 'name'])
  } catch (err) {
    if (err.status === HttpStatus.FORBIDDEN) {
      throw new errors.ForbiddenError(`You are not allowed to access the project with id ${id}`)
    }
    if (err.status === HttpStatus.NOT_FOUND) {
      throw new errors.NotFoundError(`id: ${id} project not found`)
    }
    throw err
  }
}

/**
 * Function to search skills from v5/skills
 * - only returns skills from Topcoder Skills Provider defined by `TOPCODER_SKILL_PROVIDER_ID`
 *
 * @param {Object} criteria the search criteria
 * @returns the request result
 */
async function getTopcoderSkills (criteria) {
  const token = await getM2Mtoken()
  try {
    const res = await request
      .get(`${config.TC_API}/skills`)
      .query({
        skillProviderId: config.TOPCODER_SKILL_PROVIDER_ID,
        ...criteria
      })
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
    localLogger.debug({ context: 'getTopcoderSkills', message: `response body: ${JSON.stringify(res.body)}` })
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
 * Function to get skill by id
 * @param {String} skillId the skill Id
 * @returns the request result
 */
async function getSkillById (skillId) {
  const token = await getM2Mtoken()
  const res = await request
    .get(`${config.TC_API}/skills/${skillId}`)
    .set('Authorization', `Bearer ${token}`)
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
  localLogger.debug({ context: 'getSkillById', message: `response body: ${JSON.stringify(res.body)}` })
  return _.pick(res.body, ['id', 'name'])
}

/**
 * Function to get user skills
 * @param {String} token the user request token
 * @param {String} userId user id
 * @returns the request result
 */
async function getUserSkill (token, userId) {
  const url = `${config.TC_API}/users/${userId}/skills`
  const res = await request
    .get(url)
    .set('Authorization', token)
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
  localLogger.debug({ context: 'getUserSkill', message: `response body: ${JSON.stringify(res.body)}` })
  return _.map(res.body, item => {
    return {
      id: item.id,
      name: item.skill.name
    }
  })
}

/**
 * Encapsulate the getUserId function.
 * Make sure a user exists in ubahn(/v5/users) and return the id of the user.
 *
 * In the case the user does not exist in /v5/users but can be found in /v3/users
 * Fetch the user info from /v3/users and create a new user in /v5/users.
 *
 * @params {Object} currentUser the user who perform this operation
 * @returns {String} the ubhan user id
 */
async function ensureUbhanUserId (currentUser) {
  try {
    return await getUserId(currentUser.userId)
  } catch (err) {
    if (!(err instanceof errors.NotFoundError)) {
      throw err
    }
    const topcoderUser = await getTopcoderUserById(currentUser.userId)
    const user = await createUbhanUser(_.pick(topcoderUser, ['handle', 'firstName', 'lastName']))
    await createUserExternalProfile(user.id, { organizationId: config.ORG_ID, externalId: currentUser.userId })
    return user.id
  }
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
 * Ensure user with specific id exists.
 *
 * @param {String} jobId the user id
 * @returns {Object} the user data
 */
async function ensureUserById (userId) {
  const token = await getM2Mtoken()
  try {
    const res = await request
      .get(`${config.TC_API}/users/${userId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
    localLogger.debug({ context: 'ensureUserById', message: `response body: ${JSON.stringify(res.body)}` })
    return res.body
  } catch (err) {
    if (err.status === HttpStatus.NOT_FOUND) {
      throw new errors.NotFoundError(`id: ${userId} "user" not found`)
    }
    throw err
  }
}

/**
 * Generate M2M auth user.
 *
 * @returns {Object} the M2M auth user
 */
function getAuditM2Muser () {
  return { isMachine: true, userId: config.m2m.M2M_AUDIT_USER_ID, handle: config.m2m.M2M_AUDIT_HANDLE }
}

module.exports = {
  checkIfExists,
  autoWrapExpress,
  setResHeaders,
  clearObject,
  getESClient,
  getUserId: async (userId) => {
    // check m2m user id
    if (userId === config.m2m.M2M_AUDIT_USER_ID) {
      return config.m2m.M2M_AUDIT_USER_ID
    }
    return ensureUbhanUserId({ userId })
  },
  getM2Mtoken,
  getTopcoderM2MToken,
  postEvent,
  getBusApiClient,
  isDocumentMissingException,
  getProjects,
  getUserById,
  getMembers,
  getProjectById,
  getTopcoderSkills,
  getSkillById,
  getUserSkill,
  ensureJobById,
  ensureUserById,
  getAuditM2Muser
}
