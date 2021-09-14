/**
 * This service provides operations to clean up the environment for running automated tests.
 */

const _ = require('lodash')
const config = require('config')
const models = require('../models')
const helper = require('../common/helper')
const logger = require('../common/logger')
const errors = require('../common/errors')
const Joi = require('joi')

/**
  * Delete the record from database by the given criteria.
  * @param model the model
  * @param key the search key criteria
  * @param value the search value criteria
  * @param name the entity name
  * @returns {Promise<void>}
  */
async function deleteFromDb (model, key, value, name) {
  const deleted = await model.destroy({
    where: {
      [key]: value
    },
    force: true
  })
  logger.info({ component: 'CleanUpService', context: 'cleanUpTestData', message: `${deleted} ${name}s deleted from DB` })
}

/**
  * Delete the record from elasticsearch by the given criteria.
  * @param index the index name
  * @param key the search key criteria
  * @param value the search value criteria
  * @param name the entity name
  * @returns {Promise<void>}
  */
async function deleteFromES (index, key, value, name) {
  const esClient = helper.getESClient()
  const { body } = await esClient.deleteByQuery({
    index: index,
    body: {
      query: {
        terms: { [key]: value }
      }
    }
  })
  logger.info({ component: 'CleanUpService', context: 'cleanUpTestData', message: `${body.deleted}/${body.total} ${name}s deleted from ES` })
}

/**
  * Clear the postman test data. The main function of this class.
  * @param {Object} currentUser the user who perform this operation
  * @returns {Promise<void>}
  */
async function cleanUpTestData (currentUser) {
  if (!currentUser.hasManagePermission && !currentUser.isMachine) {
    throw new errors.ForbiddenError('You are not allowed to perform this action!')
  }
  logger.info({ component: 'CleanUpService', context: 'cleanUpTestData', message: 'clear the test data from postman test!' })
  // Find job records with test prefix
  const jobsDb = await models.Job.findAll({
    where: {
      title: { [models.Sequelize.Op.like]: `${config.AUTOMATED_TESTING_NAME_PREFIX}%` }
    },
    paranoid: false,
    raw: true
  })
  const jobIdsDb = _.map(jobsDb, 'id')
  // records will be hard deleted, so the associated models will be deleted also.
  // by hard deleting resource bookings; work periods and work period payments will be deleted also
  await deleteFromDb(models.ResourceBooking, 'jobId', jobIdsDb, 'ResourceBooking')
  // interview model is not configured as cascading constraints on delete
  await deleteFromDb(models.Interview, 'hostEmail', { [models.Sequelize.Op.like]: `${config.AUTOMATED_TESTING_NAME_PREFIX}%` }, 'Interview')
  // by hard deleting jobs; job candidates will be deleted also
  await deleteFromDb(models.Job, 'id', jobIdsDb, 'Job')
  const esClient = helper.getESClient()
  const { body: jobsES } = await esClient.search({
    index: config.get('esConfig.ES_INDEX_JOB'),
    body: {
      query: {
        match_phrase_prefix: {
          title: {
            query: config.AUTOMATED_TESTING_NAME_PREFIX
          }
        }
      },
      size: 1000
    }
  })
  const jobIdsES = _.map(jobsES.hits.hits, '_id')

  await deleteFromES(config.get('esConfig.ES_INDEX_JOB'), '_id', jobIdsES, 'Job')
  await deleteFromES(config.get('esConfig.ES_INDEX_JOB_CANDIDATE'), 'jobId', jobIdsES, 'Job Candidate')
  await deleteFromES(config.get('esConfig.ES_INDEX_RESOURCE_BOOKING'), 'jobId', jobIdsES, 'Resource Booking')

  logger.info({ component: 'CleanUpService', context: 'cleanUpTestData', message: 'clear the test data from postman test completed!' })
}
cleanUpTestData.schema = Joi.object().keys({
  currentUser: Joi.object().required()
}).required()

module.exports = {
  cleanUpTestData
}
