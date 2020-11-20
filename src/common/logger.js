/**
 * This module contains the winston logger configuration.
 */

const _ = require('lodash')
const Joi = require('joi')
const util = require('util')
const config = require('config')
const getParams = require('get-parameter-names')
const winston = require('winston')

const {
  combine, timestamp, colorize, printf
} = winston.format

const basicFormat = printf(info => {
  const location = `${info.component}${info.context ? ` ${info.context}` : ''}`
  return `[${info.timestamp}] ${location} ${info.level} : ${info.message}`
})

const transports = []
if (!config.DISABLE_LOGGING) {
  transports.push(new (winston.transports.Console)({ level: config.LOG_LEVEL }))
}

const logger = winston.createLogger({
  transports,
  format: combine(
    winston.format(info => {
      info.level = info.level.toUpperCase()
      return info
    })(),
    colorize(),
    timestamp(),
    basicFormat
  )
})

logger.config = config

/**
 * Log error details
 * @param {Object} err the error
 * @param {Object} context contains extra info about errors
 */
logger.logFullError = (err, context = {}) => {
  if (!err) {
    return
  }
  if (err.logged) {
    return
  }
  const signature = context.signature ? `${context.signature} : ` : ''
  let errMessage
  if (err.response && err.response.error) {
    errMessage = err.response.error.message
  } else {
    errMessage = err.message || util.inspect(err).split('\n')[0]
  }
  logger.error({ ..._.pick(context, ['component', 'context']), message: `${signature}${errMessage}` })
  err.logged = true
}

/**
 * Remove invalid properties from the object and hide long arrays
 * @param {Object} obj the object
 * @returns {Object} the new object with removed properties
 * @private
 */
const _sanitizeObject = (obj) => {
  const hideFields = ['auth']
  try {
    return JSON.parse(JSON.stringify(obj, (k, v) => {
      return _.includes(hideFields, k) ? '<removed>' : v
    }))
  } catch (e) {
    return obj
  }
}

/**
 * Convert array with arguments to object
 * @param {Array} params the name of parameters
 * @param {Array} arr the array with values
 * @private
 */
const _combineObject = (params, arr) => {
  const ret = {}
  _.each(arr, (arg, i) => {
    ret[params[i]] = arg
  })
  return ret
}

/**
 * Decorate all functions of a service and log debug information if DEBUG is enabled
 * @param {Object} service the service
 * @param {String} serviceName the service name
 */
logger.decorateWithLogging = (service, serviceName) => {
  if (logger.config.LOG_LEVEL !== 'debug') {
    return
  }
  _.each(service, (method, name) => {
    const params = method.params || getParams(method)
    service[name] = async function () {
      const args = Array.prototype.slice.call(arguments)
      logger.debug({
        component: serviceName,
        context: name,
        message: `input arguments: ${util.inspect(_sanitizeObject(_combineObject(params, args)), { compact: true, breakLength: Infinity })}`
      })
      try {
        const result = await method.apply(this, arguments)
        logger.debug({
          component: serviceName,
          context: name,
          message: `output arguments: ${result !== null && result !== undefined
              ? util.inspect(_sanitizeObject(result), { compact: true, breakLength: Infinity, depth: null })
              : undefined}`
        })
        return result
      } catch (err) {
        logger.logFullError(err, {
          component: serviceName,
          context: name
        })
        throw err
      }
    }
  })
}

/**
 * Decorate all functions of a service and validate input values
 * and replace input arguments with sanitized result form Joi
 * Service method must have a `schema` property with Joi schema
 * @param {Object} service the service
 */
logger.decorateWithValidators = function (service) {
  _.each(service, (method, name) => {
    if (!method.schema) {
      return
    }
    const params = getParams(method)
    service[name] = async function () {
      const args = Array.prototype.slice.call(arguments)
      const value = _combineObject(params, args)
      const normalized = Joi.attempt(value, method.schema)

      const newArgs = []
      // Joi will normalize values
      // for example string number '1' to 1
      // if schema type is number
      _.each(params, (param) => {
        newArgs.push(normalized[param])
      })
      return method.apply(this, newArgs)
    }
    service[name].params = params
  })
}

/**
 * Apply logger and validation decorators
 * @param {Object} service the service to wrap
 * @param {String} serviceName the service name
 */
logger.buildService = (service, serviceName) => {
  logger.decorateWithValidators(service)
  logger.decorateWithLogging(service, serviceName)
}

module.exports = logger
