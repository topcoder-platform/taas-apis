/**
 * Create index in Elasticsearch
 */
const config = require('config')
const logger = require('../../src/common/logger')
const helper = require('../../src/common/helper')

const indices = [
  config.get('esConfig.ES_INDEX_JOB'),
  config.get('esConfig.ES_INDEX_JOB_CANDIDATE'),
  config.get('esConfig.ES_INDEX_RESOURCE_BOOKING'),
  config.get('esConfig.ES_INDEX_USER_MEETING_SETTINGS')
]
const userPrompt = `WARNING: Are you sure want to create the following elasticsearch indices: ${indices}?`

async function createIndex () {
  await helper.promptUser(userPrompt, async () => {
    for (const index of indices) {
      try {
        await helper.createIndex(index, logger)
      } catch (err) {
        logger.logFullError(err, { component: 'createIndex' })
        process.exit(1)
      }
    }
    process.exit(0)
  })
}

createIndex()
