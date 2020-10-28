/**
 * Delete index in Elasticsearch
 */

const config = require('config')
const logger = require('../src/common/logger')
const helper = require('../src/common/helper')

async function deleteIndex () {
  logger.info('ES Index deletion started!')
  const esClient = helper.getESClient()
  const indices = [config.get('esConfig.ES_INDEX_JOB'),
    config.get('esConfig.ES_INDEX_JOB_CANDIDATE'),
    config.get('esConfig.ES_INDEX_RESOURCE_BOOKING')]
  for (const index of indices) {
    await esClient.indices.delete({
      index
    })
    logger.info(`ES Index ${index} deletion succeeded!`)
  }
  process.exit(0)
}
deleteIndex().catch((err) => {
  logger.logFullError(err)
  process.exit(1)
})
