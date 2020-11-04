/**
 * This file defines helper methods
 */

const querystring = require('querystring')
const config = require('config')
const _ = require('lodash')
const request = require('superagent')
const elasticsearch = require('@elastic/elasticsearch')
const errors = require('../common/errors')

const m2mAuth = require('tc-core-library-js').auth.m2m
const m2mAuthUbahn = require('tc-core-library-js').auth.m2m

//const m2m = m2mAuth(_.pick(config, ['AUTH0_URL', 'AUTH0_AUDIENCE', 'TOKEN_CACHE_TIME', 'AUTH0_PROXY_SERVER_URL']))
const m2m = m2mAuth(_.pick(config, ['AUTH0_URL', 'AUTH0_AUDIENCE', 'AUTH0_PROXY_SERVER_URL']))
const m2mU = m2mAuthUbahn(config.uM2mConfig)


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
  const esHost = config.get('esConfig.HOST')
  if (!esClients.client) {
    esClients.client = new elasticsearch.Client({
      node: esHost
    })
  }
  return esClients.client
}

/*
 * Function to get M2M token
 * @returns {Promise}
 */
const getM2Mtoken = async () => {
  return m2m.getMachineToken(config.AUTH0_CLIENT_ID, config.AUTH0_CLIENT_SECRET)
}

/*
 * Function to get M2M token
 * @returns {Promise}
 */
const getM2MUtoken = async () => {
  return m2mU.getMachineToken(config.AUTH0_CLIENT_ID, config.AUTH0_CLIENT_SECRET)
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
  const token = await getM2MUtoken()
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
    throw new errors.NotFoundError('user id not found')
  }
  return ids[0].id
}

module.exports = {
  autoWrapExpress,
  setResHeaders,
  clearObject,
  isConnectMember,
  getESClient,
  getUserId
}
