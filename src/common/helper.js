/**
 * This file defines helper methods
 */

const querystring = require('querystring')
const AWS = require('aws-sdk')
const config = require('config')
const _ = require('lodash')
const request = require('superagent')
const elasticsearch = require('@elastic/elasticsearch')
const errors = require('../common/errors')
const logger = require('./logger')
const busApi = require('@topcoder-platform/topcoder-bus-api-wrapper')

const localLogger = {
  debug: (message) => logger.debug({ component: 'helper', context: message.context, message: message.message })
}

AWS.config.region = config.esConfig.AWS_REGION

const m2mAuth = require('tc-core-library-js').auth.m2m

// const m2m = m2mAuth(_.pick(config, ['AUTH0_URL', 'AUTH0_AUDIENCE', 'TOKEN_CACHE_TIME', 'AUTH0_PROXY_SERVER_URL']))
const m2m = m2mAuth(_.pick(config, ['AUTH0_URL', 'AUTH0_AUDIENCE', 'AUTH0_CLIENT_ID', 'AUTH0_CLIENT_SECRET', 'AUTH0_PROXY_SERVER_URL']))

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

  // Allow browsers access pagination data in headers
  let accessControlExposeHeaders = res.get('Access-Control-Expose-Headers') || ''
  accessControlExposeHeaders += accessControlExposeHeaders ? ', ' : ''
  // append new values, to not override values set by someone else
  accessControlExposeHeaders += 'X-Page, X-Per-Page, X-Total, X-Total-Pages, X-Prev-Page, X-Next-Page'

  res.set('Access-Control-Expose-Headers', accessControlExposeHeaders)
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
 * Check whether connect member or not
 * @param {Number} projectId the project id
 * @param {String} jwtToken the jwt token
 * @param {Boolean}
 */
async function isConnectMember (projectId, jwtToken) {
  const url = `${config.PROJECT_API_URL}/v5/projects/${projectId}`
  try {
    await request
      .get(url)
      .set('Authorization', jwtToken)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
  } catch (err) {
    return false
  }
  return true
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
 */
async function postEvent (topic, payload) {
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
 * @param {String} token the user request token
 * @returns the request result
 */
async function getProjects (token) {
/*  const url = `${config.TC_API}/projects?type=talent-as-a-service`
  const res = await request
    .get(url)
    .query({
      memberOnly: true
    })
    .set('Authorization', token)
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
  localLogger.debug({ context: 'getProjects', message: `response body: ${JSON.stringify(res.body)}` })
  return _.map(res.body, item => {
    return _.pick(item, ['id', 'name'])
  })*/
  
  const url = `${config.TC_API}/projects?type=talent-as-a-service`
  let data = []
  let page = 1
  while (true) {
    const res = await request
      .get(url)
      .query({
        page,
        memberOnly: true
      })
      .set('Authorization', token)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
    localLogger.debug({ context: 'getProjects', message: `page ${page} - response body: ${JSON.stringify(res.body)}` })
    data = [...data, ...res.body]
    page += 1
    if (!res.headers['x-next-page']) {
      break
    }
  }
  return _.map(data, item => {
    return _.pick(item, ['id', 'name'])
  })
}

/**
 * Function to get users
 * @param {String} token the user request token
 * @param {String} userId the user id
 * @returns the request result
 */
async function getUserById (token, userId) {
  const res = await request
    .get(`${config.TC_API}/users/${userId}`)
    .set('Authorization', token)
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
  localLogger.debug({ context: 'getUserById', message: `response body: ${JSON.stringify(res.body)}` })
  return _.pick(res.body, ['id', 'handle', 'firstName', 'lastName'])
}

/**
 * Function to get members
 * @param {String} token the user request token
 * @param {Array} handles the handle array
 * @returns the request result
 */
async function getMembers (token, handles) {
 /* const handlesStr = _.map(handles, handle => {
    return '%22' + handle.toLowerCase() + '%22'
  }).join(',')
  const url = `${config.TC_API}/members?fields=userId,handleLower,photoURL&handlesLower=[${handlesStr}]`

  const res = await request
    .get(url)
    .set('Authorization', token)
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
  localLogger.debug({ context: 'getMembers', message: `response body: ${JSON.stringify(res.body)}` })
  return res.body */
  
    const handlesStr = _.map(handles, handle => {
    return '%22' + handle.toLowerCase() + '%22'
  }).join(',')
  const url = `${config.TC_API}/members?fields=userId,handleLower,photoURL&handlesLower=[${handlesStr}]`

  let data = []
  let page = 1
  while (true) {
    const res = await request
      .get(url)
      .query({
        page
      })
      .set('Authorization', token)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
    localLogger.debug({ context: 'getMembers', message: `page ${page} - response body: ${JSON.stringify(res.body)}` })
    data = [...data, ...res.body]
    page += 1
    if (!res.headers['x-next-page']) {
      break
    }
  }
  return data
}

/**
 * Function to get project by id
 * @param {String} token the user request token
 * @param {Number} id project id
 * @returns the request result
 */
async function getProjectById (token, id) {
  const url = `${config.TC_API}/projects/${id}`
  const res = await request
    .get(url)
    .set('Authorization', token)
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
  localLogger.debug({ context: 'getProjectById', message: `response body: ${JSON.stringify(res.body)}` })
  return _.pick(res.body, ['id', 'name'])
}

/**
 * Function to get skill by id
 * @param {String} token the user request token
 * @param {String} skillId the skill Id
 * @returns the request result
 */
async function getSkillById (token, skillId) {
  const res = await request
    .get(`${config.TC_API}/skills/${skillId}`)
    .set('Authorization', token)
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

module.exports = {
  autoWrapExpress,
  setResHeaders,
  clearObject,
  isConnectMember,
  getESClient,
  getUserId,
  postEvent,
  getBusApiClient,
  isDocumentMissingException,
  getProjects,
  getM2Mtoken,
  getUserById,
  getMembers,
  getProjectById,
  getSkillById,
  getUserSkill
}
