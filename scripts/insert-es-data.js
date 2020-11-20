/**
 * Import data into ES.
 */
const config = require('config')
const _ = require('lodash')
const logger = require('../src/common/logger')
const helper = require('../src/common/helper')

const jobs = require('./feed-data/jobs.json').result

const jobCandidates = require('./feed-data/jobCandidates.json').result

const resourceBookings = require('./feed-data/resourceBookings.json').result

const insertESData = async () => {
  logger.info('Inserting ES Data started!')
  const esClient = helper.getESClient()

  await esClient.deleteByQuery({
    index: config.get('esConfig.ES_INDEX_RESOURCE_BOOKING'),
    body: {
      query: {
        match_all: { }
      }
    }
  })
  logger.info('Clear all ES Data on ' + config.get('esConfig.ES_INDEX_RESOURCE_BOOKING'))

  await esClient.deleteByQuery({
    index: config.get('esConfig.ES_INDEX_JOB_CANDIDATE'),
    body: {
      query: {
        match_all: { }
      }
    }
  })
  logger.info('Clear all ES Data on ' + config.get('esConfig.ES_INDEX_JOB_CANDIDATE'))

  await esClient.deleteByQuery({
    index: config.get('esConfig.ES_INDEX_JOB'),
    body: {
      query: {
        match_all: { }
      }
    }
  })
  logger.info('Clear all ES Data on ' + config.get('esConfig.ES_INDEX_JOB'))

  for (const job of jobs) {
    await esClient.create({
      index: config.get('esConfig.ES_INDEX_JOB'),
      id: job.id,
      body: _.omit(job, 'id'),
      refresh: 'true'
    })
  }
  logger.info('Insert ES Data on ' + config.get('esConfig.ES_INDEX_JOB'))

  for (const jobCandidate of jobCandidates) {
    await esClient.create({
      index: config.get('esConfig.ES_INDEX_JOB_CANDIDATE'),
      id: jobCandidate.id,
      body: _.omit(jobCandidate, 'id'),
      refresh: 'true'
    })
  }
  logger.info('Insert ES Data on ' + config.get('esConfig.ES_INDEX_JOB_CANDIDATE'))

  for (const resourceBooking of resourceBookings) {
    await esClient.create({
      index: config.get('esConfig.ES_INDEX_RESOURCE_BOOKING'),
      id: resourceBooking.id,
      body: _.omit(resourceBooking, 'id'),
      refresh: 'true'
    })
  }
  logger.info('Insert ES Data on ' + config.get('esConfig.ES_INDEX_RESOURCE_BOOKING'))
}

if (!module.parent) {
  insertESData().then(() => {
    logger.info('Inserting ES Data successfully')
    process.exit()
  }).catch((e) => {
    logger.logFullError(e)
    process.exit(1)
  })
}

module.exports = {
  insertESData: insertESData
}
