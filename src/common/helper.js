/**
 * This file defines helper methods
 */

const fs = require('fs')
const querystring = require('querystring')
const Confirm = require('prompt-confirm')
const Bottleneck = require('bottleneck')
const AWS = require('aws-sdk')
const config = require('config')
const HttpStatus = require('http-status-codes')
const _ = require('lodash')
const request = require('superagent')
const elasticsearch = require('@elastic/elasticsearch')
const {
  ResponseError: ESResponseError
} = require('@elastic/elasticsearch/lib/errors')
const errors = require('../common/errors')
const logger = require('./logger')
const models = require('../models')
const eventDispatcher = require('./eventDispatcher')
const busApi = require('@topcoder-platform/topcoder-bus-api-wrapper')
const moment = require('moment')
const { PaymentStatusRules } = require('../../app-constants')

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

AWS.config.region = config.esConfig.AWS_REGION

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

const m2mForUbahn = m2mAuth({
  AUTH0_AUDIENCE: config.AUTH0_AUDIENCE_UBAHN,
  ..._.pick(config, [
    'AUTH0_URL',
    'TOKEN_CACHE_TIME',
    'AUTH0_CLIENT_ID',
    'AUTH0_CLIENT_SECRET',
    'AUTH0_PROXY_SERVER_URL'
  ])
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

// ES Client mapping
const esClients = {}

// The es index property mapping
const esIndexPropertyMapping = {}
esIndexPropertyMapping[config.get('esConfig.ES_INDEX_JOB')] = {
  projectId: { type: 'integer' },
  externalId: { type: 'keyword' },
  description: { type: 'text' },
  title: { type: 'text' },
  startDate: { type: 'date' },
  duration: { type: 'integer' },
  numPositions: { type: 'integer' },
  resourceType: { type: 'keyword' },
  rateType: { type: 'keyword' },
  workload: { type: 'keyword' },
  skills: { type: 'keyword' },
  status: { type: 'keyword' },
  isApplicationPageActive: { type: 'boolean' },
  minSalary: { type: 'integer' },
  maxSalary: { type: 'integer' },
  hoursPerWeek: { type: 'integer' },
  jobLocation: { type: 'keyword' },
  jobTimezone: { type: 'keyword' },
  currency: { type: 'keyword' },
  roleIds: { type: 'keyword' },
  createdAt: { type: 'date' },
  createdBy: { type: 'keyword' },
  updatedAt: { type: 'date' },
  updatedBy: { type: 'keyword' }
}
esIndexPropertyMapping[config.get('esConfig.ES_INDEX_JOB_CANDIDATE')] = {
  jobId: { type: 'keyword' },
  userId: { type: 'keyword' },
  status: { type: 'keyword' },
  externalId: { type: 'keyword' },
  resume: { type: 'text' },
  remark: { type: 'keyword' },
  interviews: {
    type: 'nested',
    properties: {
      id: { type: 'keyword' },
      xaiId: { type: 'keyword' },
      jobCandidateId: { type: 'keyword' },
      calendarEventId: { type: 'keyword' },
      templateUrl: { type: 'keyword' },
      templateId: { type: 'keyword' },
      templateType: { type: 'keyword' },
      title: { type: 'keyword' },
      locationDetails: { type: 'keyword' },
      duration: { type: 'integer' },
      startTimestamp: { type: 'date' },
      endTimestamp: { type: 'date' },
      hostName: { type: 'keyword' },
      hostEmail: { type: 'keyword' },
      guestNames: { type: 'keyword' },
      guestEmails: { type: 'keyword' },
      round: { type: 'integer' },
      status: { type: 'keyword' },
      rescheduleUrl: { type: 'keyword' },
      createdAt: { type: 'date' },
      createdBy: { type: 'keyword' },
      updatedAt: { type: 'date' },
      updatedBy: { type: 'keyword' },
      deletedAt: { type: 'date' }
    }
  },
  createdAt: { type: 'date' },
  createdBy: { type: 'keyword' },
  updatedAt: { type: 'date' },
  updatedBy: { type: 'keyword' }
}
esIndexPropertyMapping[config.get('esConfig.ES_INDEX_RESOURCE_BOOKING')] = {
  projectId: { type: 'integer' },
  userId: { type: 'keyword' },
  jobId: { type: 'keyword' },
  status: { type: 'keyword' },
  startDate: { type: 'date', format: 'yyyy-MM-dd' },
  endDate: { type: 'date', format: 'yyyy-MM-dd' },
  memberRate: { type: 'float' },
  customerRate: { type: 'float' },
  rateType: { type: 'keyword' },
  billingAccountId: { type: 'integer' },
  workPeriods: {
    type: 'nested',
    properties: {
      id: { type: 'keyword' },
      resourceBookingId: { type: 'keyword' },
      userHandle: {
        type: 'keyword',
        normalizer: 'lowercaseNormalizer'
      },
      projectId: { type: 'integer' },
      userId: { type: 'keyword' },
      startDate: { type: 'date', format: 'yyyy-MM-dd' },
      endDate: { type: 'date', format: 'yyyy-MM-dd' },
      daysWorked: { type: 'integer' },
      daysPaid: { type: 'integer' },
      paymentTotal: { type: 'float' },
      paymentStatus: { type: 'keyword' },
      payments: {
        type: 'nested',
        properties: {
          id: { type: 'keyword' },
          workPeriodId: { type: 'keyword' },
          challengeId: { type: 'keyword' },
          memberRate: { type: 'float' },
          customerRate: { type: 'float' },
          days: { type: 'integer' },
          amount: { type: 'float' },
          status: { type: 'keyword' },
          statusDetails: {
            type: 'nested',
            properties: {
              errorMessage: { type: 'text' },
              errorCode: { type: 'integer' },
              retry: { type: 'integer' },
              step: { type: 'keyword' },
              challengeId: { type: 'keyword' }
            }
          },
          billingAccountId: { type: 'integer' },
          createdAt: { type: 'date' },
          createdBy: { type: 'keyword' },
          updatedAt: { type: 'date' },
          updatedBy: { type: 'keyword' }
        }
      },
      createdAt: { type: 'date' },
      createdBy: { type: 'keyword' },
      updatedAt: { type: 'date' },
      updatedBy: { type: 'keyword' }
    }
  },
  createdAt: { type: 'date' },
  createdBy: { type: 'keyword' },
  updatedAt: { type: 'date' },
  updatedBy: { type: 'keyword' }
}
esIndexPropertyMapping[config.get('esConfig.ES_INDEX_ROLE')] = {
  name: {
    type: 'keyword',
    normalizer: 'lowercaseNormalizer'
  },
  description: { type: 'keyword' },
  listOfSkills: {
    type: 'keyword',
    normalizer: 'lowercaseNormalizer'
  },
  rates: {
    properties: {
      global: { type: 'integer' },
      inCountry: { type: 'integer' },
      offShore: { type: 'integer' },
      rate30Global: { type: 'integer' },
      rate30InCountry: { type: 'integer' },
      rate30OffShore: { type: 'integer' },
      rate20Global: { type: 'integer' },
      rate20InCountry: { type: 'integer' },
      rate20OffShore: { type: 'integer' }
    }
  },
  numberOfMembers: { type: 'integer' },
  numberOfMembersAvailable: { type: 'integer' },
  imageUrl: { type: 'keyword' },
  timeToCandidate: { type: 'integer' },
  timeToInterview: { type: 'integer' },
  createdAt: { type: 'date' },
  createdBy: { type: 'keyword' },
  updatedAt: { type: 'date' },
  updatedBy: { type: 'keyword' }
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
 * Create index in elasticsearch
 * @param {Object} index the index name
 * @param {Object} logger the logger object
 * @param {Object} esClient the elasticsearch client (optional, will create if not given)
 */
async function createIndex (index, logger, esClient = null) {
  if (!esClient) {
    esClient = getESClient()
  }

  await esClient.indices.create({ index })
  await esClient.indices.close({ index })
  await esClient.indices.putSettings({
    index: index,
    body: {
      settings: {
        analysis: {
          normalizer: {
            lowercaseNormalizer: {
              filter: ['lowercase']
            }
          }
        }
      }
    }
  })
  await esClient.indices.open({ index })
  await esClient.indices.putMapping({
    index,
    body: {
      properties: esIndexPropertyMapping[index]
    }
  })
  logger.info({
    component: 'createIndex',
    message: `ES Index ${index} creation succeeded!`
  })
}

/**
 * Delete index in elasticsearch
 * @param {Object} index the index name
 * @param {Object} logger the logger object
 * @param {Object} esClient the elasticsearch client (optional, will create if not given)
 */
async function deleteIndex (index, logger, esClient = null) {
  if (!esClient) {
    esClient = getESClient()
  }

  await esClient.indices.delete({ index })
  logger.info({
    component: 'deleteIndex',
    message: `ES Index ${index} deletion succeeded!`
  })
}

/**
 * Split data into bulks
 * @param {Array} data the array of data to split
 */
function getBulksFromDocuments (data) {
  const maxBytes = config.get('esConfig.MAX_BULK_REQUEST_SIZE_MB') * 1e6
  const bulks = []
  let documentIndex = 0
  let currentBulkSize = 0
  let currentBulk = []

  while (true) {
    // break loop when parsed all documents
    if (documentIndex >= data.length) {
      bulks.push(currentBulk)
      break
    }

    // check if current document size is greater than the max bulk size, if so, throw error
    const currentDocumentSize = Buffer.byteLength(
      JSON.stringify(data[documentIndex]),
      'utf-8'
    )
    if (maxBytes < currentDocumentSize) {
      throw new Error(
        `Document with id ${data[documentIndex]} has size ${currentDocumentSize}, which is greater than the max bulk size, ${maxBytes}. Consider increasing the max bulk size.`
      )
    }

    if (
      currentBulkSize + currentDocumentSize > maxBytes ||
      currentBulk.length >= config.get('esConfig.MAX_BULK_NUM_DOCUMENTS')
    ) {
      // if adding the current document goes over the max bulk size OR goes over max number of docs
      // then push the current bulk to bulks array and reset the current bulk
      bulks.push(currentBulk)
      currentBulk = []
      currentBulkSize = 0
    } else {
      // otherwise, add document to current bulk
      currentBulk.push(data[documentIndex])
      currentBulkSize += currentDocumentSize
      documentIndex++
    }
  }
  return bulks
}

/**
 * Index records in bulk
 * @param {Object | String} modelOpts the model name in db, or model options
 * @param {Object} indexName the index name
 * @param {Object} logger the logger object
 */
async function indexBulkDataToES (modelOpts, indexName, logger) {
  const modelName = _.isString(modelOpts) ? modelOpts : modelOpts.modelName
  const include = _.get(modelOpts, 'include', [])

  logger.info({
    component: 'indexBulkDataToES',
    message: `Reindexing of ${modelName}s started!`
  })

  const esClient = getESClient()

  // clear index
  const indexExistsRes = await esClient.indices.exists({ index: indexName })
  if (indexExistsRes.statusCode !== 404) {
    await deleteIndex(indexName, logger, esClient)
  }
  await createIndex(indexName, logger, esClient)

  // get data from db
  logger.info({
    component: 'indexBulkDataToES',
    message: 'Getting data from database'
  })
  const model = models[modelName]
  const data = await model.findAll({ include })
  const rawObjects = _.map(data, (r) => r.toJSON())
  if (_.isEmpty(rawObjects)) {
    logger.info({
      component: 'indexBulkDataToES',
      message: `No data in database for ${modelName}`
    })
    return
  }
  const bulks = getBulksFromDocuments(rawObjects)

  const startTime = Date.now()
  let doneCount = 0
  for (const bulk of bulks) {
    // send bulk to esclient
    const body = bulk.flatMap((doc) => [
      { index: { _index: indexName, _id: doc.id } },
      doc
    ])
    await esClient.bulk({ refresh: true, body })
    doneCount += bulk.length

    // log metrics
    const timeSpent = Date.now() - startTime
    const avgTimePerDocument = timeSpent / doneCount
    const estimatedLength = avgTimePerDocument * data.length
    const timeLeft = startTime + estimatedLength - Date.now()
    logger.info({
      component: 'indexBulkDataToES',
      message: `Processed ${doneCount} of ${
        data.length
      } documents, average time per document ${formatTime(
        avgTimePerDocument
      )}, time spent: ${formatTime(timeSpent)}, time left: ${formatTime(
        timeLeft
      )}`
    })
  }
}

/**
 * Index job by id
 * @param {Object | String} modelOpts the model name in db, or model options
 * @param {Object} indexName the index name
 * @param {string} id the job id
 * @param {Object} logger the logger object
 */
async function indexDataToEsById (id, modelOpts, indexName, logger) {
  const modelName = _.isString(modelOpts) ? modelOpts : modelOpts.modelName
  const include = _.get(modelOpts, 'include', [])

  logger.info({
    component: 'indexDataToEsById',
    message: `Reindexing of ${modelName} with id ${id} started!`
  })
  const esClient = getESClient()

  logger.info({
    component: 'indexDataToEsById',
    message: 'Getting data from database'
  })
  const model = models[modelName]

  const data = await model.findById(id, include)
  logger.info({
    component: 'indexDataToEsById',
    message: 'Indexing data into Elasticsearch'
  })
  await esClient.index({
    index: indexName,
    id: id,
    body: data.dataValues
  })
  logger.info({
    component: 'indexDataToEsById',
    message: 'Indexing complete!'
  })
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

  // after importing, index data
  const jobCandidateModelOpts = {
    modelName: 'JobCandidate',
    include: [
      {
        model: models.Interview,
        as: 'interviews'
      }
    ]
  }
  const resourceBookingModelOpts = {
    modelName: 'ResourceBooking',
    include: [
      {
        model: models.WorkPeriod,
        as: 'workPeriods',
        include: [
          {
            model: models.WorkPeriodPayment,
            as: 'payments'
          }
        ]
      }
    ]
  }
  await indexBulkDataToES('Job', config.get('esConfig.ES_INDEX_JOB'), logger)
  await indexBulkDataToES(
    jobCandidateModelOpts,
    config.get('esConfig.ES_INDEX_JOB_CANDIDATE'),
    logger
  )
  await indexBulkDataToES(
    resourceBookingModelOpts,
    config.get('esConfig.ES_INDEX_RESOURCE_BOOKING'),
    logger
  )
  await indexBulkDataToES('Role', config.get('esConfig.ES_INDEX_ROLE'), logger)
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
 * Format a time in milliseconds into a human readable format
 * @param {Date} milliseconds the number of milliseconds
 */
function formatTime (millisec) {
  const ms = Math.floor(millisec % 1000)
  const secs = Math.floor((millisec / 1000) % 60)
  const mins = Math.floor((millisec / (1000 * 60)) % 60)
  const hrs = Math.floor((millisec / (1000 * 60 * 60)) % 24)
  const days = Math.floor((millisec / (1000 * 60 * 60 * 24)) % 7)
  const weeks = Math.floor((millisec / (1000 * 60 * 60 * 24 * 7)) % 4)
  const mnths = Math.floor((millisec / (1000 * 60 * 60 * 24 * 7 * 4)) % 12)
  const yrs = Math.floor(millisec / (1000 * 60 * 60 * 24 * 7 * 4 * 12))

  let formattedTime = '0 milliseconds'
  if (ms > 0) {
    formattedTime = `${ms} milliseconds`
  }
  if (secs > 0) {
    formattedTime = `${secs} seconds ${formattedTime}`
  }
  if (mins > 0) {
    formattedTime = `${mins} minutes ${formattedTime}`
  }
  if (hrs > 0) {
    formattedTime = `${hrs} hours ${formattedTime}`
  }
  if (days > 0) {
    formattedTime = `${days} days ${formattedTime}`
  }
  if (weeks > 0) {
    formattedTime = `${weeks} weeks ${formattedTime}`
  }
  if (mnths > 0) {
    formattedTime = `${mnths} months ${formattedTime}`
  }
  if (yrs > 0) {
    formattedTime = `${yrs} years ${formattedTime}`
  }

  return formattedTime.trim()
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
const getM2MToken = async () => {
  return await m2m.getMachineToken(
    config.AUTH0_CLIENT_ID,
    config.AUTH0_CLIENT_SECRET
  )
}

/*
 * Function to get M2M token for U-Bahn
 * @returns {Promise}
 */
const getM2MUbahnToken = async () => {
  return await m2mForUbahn.getMachineToken(
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
 * Function to list users by external id.
 * @param {Integer} externalId the legacy user id
 * @returns {Array} the users found
 */
async function listUsersByExternalId (externalId) {
  // return empty list if externalId is null or undefined
  if (!!externalId !== true) {
    return []
  }

  const token = await getM2MUbahnToken()
  const q = {
    enrich: true,
    externalProfile: {
      organizationId: config.ORG_ID,
      externalId
    }
  }
  const url = `${config.TC_API}/users?${encodeQueryString(q)}`
  const res = await request
    .get(url)
    .set('Authorization', `Bearer ${token}`)
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
  localLogger.debug({
    context: 'listUserByExternalId',
    message: `response body: ${JSON.stringify(res.body)}`
  })
  return res.body
}

/**
 * Function to get user by external id.
 * @param {Integer} externalId the legacy user id
 * @returns {Object} the user
 */
async function getUserByExternalId (externalId) {
  const users = await listUsersByExternalId(externalId)
  if (_.isEmpty(users)) {
    throw new errors.NotFoundError(
      `externalId: ${externalId} "user" not found`
    )
  }
  return users[0]
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
 * Test if an error is document missing exception
 *
 * @param {Object} err the err
 * @returns {Boolean} the result
 */
function isDocumentMissingException (err) {
  if (err.statusCode === 404 && err instanceof ESResponseError) {
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
    return _.pick(item, ['id', 'name', 'invites', 'members'])
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
  const token = await getM2MToken()
  const res = await request
    .get(config.TOPCODER_USERS_API)
    .query({ filter: `id=${userId}` })
    .set('Authorization', `Bearer ${token}`)
    .set('Accept', 'application/json')
  localLogger.debug({
    context: 'getTopcoderUserById',
    message: `response body: ${JSON.stringify(res.body)}`
  })
  const user = _.get(res.body, 'result.content[0]')
  if (!user) {
    throw new errors.NotFoundError(
      `userId: ${userId} "user" not found from ${config.TOPCODER_USERS_API}`
    )
  }
  return user
}

/**
 * Function to get users
 * @param {String} userId the user id
 * @returns the request result
 */
async function getUserById (userId, enrich) {
  const token = await getM2MUbahnToken()
  const res = await request
    .get(`${config.TC_API}/users/${userId}` + (enrich ? '?enrich=true' : ''))
    .set('Authorization', `Bearer ${token}`)
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
  localLogger.debug({
    context: 'getUserById',
    message: `response body: ${JSON.stringify(res.body)}`
  })

  const user = _.pick(res.body, ['id', 'handle', 'firstName', 'lastName'])

  if (enrich) {
    user.skills = (res.body.skills || []).map((skillObj) =>
      _.pick(skillObj.skill, ['id', 'name'])
    )
    const attributes = _.get(res, 'body.attributes', [])
    user.attributes = _.map(attributes, (attr) =>
      _.pick(attr, ['id', 'value', 'attribute.id', 'attribute.name'])
    )
  }

  return user
}

/**
 * Function to create user in ubahn
 * @param {Object} data the user data
 * @returns the request result
 */
async function createUbahnUser ({ handle, firstName, lastName }) {
  const token = await getM2MUbahnToken()
  const res = await request
    .post(`${config.TC_API}/users`)
    .set('Authorization', `Bearer ${token}`)
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
    .send({ handle, firstName, lastName })
  localLogger.debug({
    context: 'createUbahnUser',
    message: `response body: ${JSON.stringify(res.body)}`
  })
  return _.pick(res.body, ['id'])
}

/**
 * Function to create external profile for a ubahn user
 * @param {String} userId the user id(with uuid format)
 * @param {Object} data the profile data
 */
async function createUserExternalProfile (
  userId,
  { organizationId, externalId }
) {
  const token = await getM2MUbahnToken()
  const res = await request
    .post(`${config.TC_API}/users/${userId}/externalProfiles`)
    .set('Authorization', `Bearer ${token}`)
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
    .send({ organizationId, externalId: String(externalId) })
  localLogger.debug({
    context: 'createUserExternalProfile',
    message: `response body: ${JSON.stringify(res.body)}`
  })
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
    return _.pick(res.body, ['id', 'name', 'invites', 'members'])
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
 * - only returns skills from Topcoder Skills Provider defined by `TOPCODER_SKILL_PROVIDER_ID`
 *
 * @param {Object} criteria the search criteria
 * @returns the request result
 */
async function getTopcoderSkills (criteria) {
  const token = await getM2MUbahnToken()
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
 * - only returns skills from Topcoder Skills Provider defined by `TOPCODER_SKILL_PROVIDER_ID`
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
  const token = await getM2MUbahnToken()
  const res = await request
    .get(`${config.TC_API}/skills/${skillId}`)
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
 * Encapsulate the getUserByExternalId function.
 * Make sure a user exists in ubahn(/v5/users) and return the id of the user.
 *
 * In the case the user does not exist in /v5/users but can be found in /v3/users
 * Fetch the user info from /v3/users and create a new user in /v5/users.
 *
 * @params {Object} currentUser the user who perform this operation
 * @returns {String} the ubahn user id
 */
async function ensureUbahnUserId (currentUser) {
  try {
    return (await getUserByExternalId(currentUser.userId)).id
  } catch (err) {
    if (!(err instanceof errors.NotFoundError)) {
      throw err
    }
    const topcoderUser = await getTopcoderUserById(currentUser.userId)
    const user = await createUbahnUser(
      _.pick(topcoderUser, ['handle', 'firstName', 'lastName'])
    )
    await createUserExternalProfile(user.id, {
      organizationId: config.ORG_ID,
      externalId: currentUser.userId
    })
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
 * Ensure user with specific id exists.
 *
 * @param {String} jobId the user id
 * @returns {Object} the user data
 */
async function ensureUserById (userId) {
  const token = await getM2MUbahnToken()
  try {
    const res = await request
      .get(`${config.TC_API}/users/${userId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
    localLogger.debug({
      context: 'ensureUserById',
      message: `response body: ${JSON.stringify(res.body)}`
    })
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
 * @param {Object} user The enriched (i.e. includes attributes) user object from users API. (check getUserById, getUserByExternalId functions)
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
async function substituteStringByObject (string, object) {
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
  return _.get(res, 'body')
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

module.exports = {
  getParamFromCliArgs,
  promptUser,
  sleep,
  createIndex,
  deleteIndex,
  indexBulkDataToES,
  indexDataToEsById,
  importData,
  exportData,
  checkIfExists,
  autoWrapExpress,
  setResHeaders,
  getESClient,
  getUserId: async (userId) => {
    // check m2m user id
    if (userId === config.m2m.M2M_AUDIT_USER_ID) {
      return config.m2m.M2M_AUDIT_USER_ID
    }
    return ensureUbahnUserId({ userId })
  },
  getUserByExternalId,
  getM2MToken,
  getM2MUbahnToken,
  postEvent,
  getBusApiClient,
  isDocumentMissingException,
  getProjects,
  getUserById,
  getMembers,
  getProjectById,
  getTopcoderSkills,
  getAllTopcoderSkills,
  getSkillById,
  ensureJobById,
  ensureResourceBookingById,
  ensureUserById,
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
  getMembersSuggest
}
