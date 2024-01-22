/**
 * Delete index in Elasticsearch
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
const userPrompt = `WARNING: this would remove existent data! Are you sure want to delete the following eleasticsearch indices: ${indices}?`

async function deleteIndex () {
  await helper.promptUser(userPrompt, async () => {
    for (const index of indices) {
      try {
        await helper.deleteIndex(index, logger)
      } catch (err) {
        logger.logFullError(err, { component: 'deleteIndex' })
        process.exit(1)
      }
    }
    process.exit(0)
  })
}

deleteIndex()
