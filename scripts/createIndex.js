/**
 * Create index in Elasticsearch
 */

const config = require('config')
const logger = require('../src/common/logger')
const helper = require('../src/common/helper')

async function createIndex () {
  const esClient = helper.getESClient()

  const indices = [
    {
      index: config.get('esConfig.ES_INDEX_JOB'),
      body: {
        mappings: {
          properties: {
            projectId: { type: 'integer' },
            externalId: { type: 'keyword' },
            description: { type: 'text' },
            title: { type: 'text' },
            startDate: { type: 'date' },
            endDate: { type: 'date' },
            numPositions: { type: 'integer' },
            resourceType: { type: 'keyword' },
            rateType: { type: 'keyword' },
            workload: { type: 'keyword' },
            skills: { type: 'keyword' },
            status: { type: 'keyword' },
            createdAt: { type: 'date' },
            createdBy: { type: 'keyword' },
            updatedAt: { type: 'date' },
            updatedBy: { type: 'keyword' }
          }
        }
      }
    },
    {
      index: config.get('esConfig.ES_INDEX_JOB_CANDIDATE'),
      body: {
        mappings: {
          properties: {
            jobId: { type: 'keyword' },
            userId: { type: 'keyword' },
            status: { type: 'keyword' },
            externalId: { type: 'keyword' },
            resume: { type: 'text' },
            createdAt: { type: 'date' },
            createdBy: { type: 'keyword' },
            updatedAt: { type: 'date' },
            updatedBy: { type: 'keyword' }
          }
        }
      }
    },
    {
      index: config.get('esConfig.ES_INDEX_RESOURCE_BOOKING'),
      body: {
        mappings: {
          properties: {
            projectId: { type: 'integer' },
            userId: { type: 'keyword' },
            jobId: { type: 'keyword' },
            status: { type: 'keyword' },
            startDate: { type: 'date' },
            endDate: { type: 'date' },
            memberRate: { type: 'float' },
            customerRate: { type: 'float' },
            rateType: { type: 'keyword' },
            createdAt: { type: 'date' },
            createdBy: { type: 'keyword' },
            updatedAt: { type: 'date' },
            updatedBy: { type: 'keyword' }
          }
        }
      }
    }]

  for (const index of indices) {
    await esClient.indices.create(index)
    logger.info({ component: 'createIndex', message: `ES Index ${index.index} creation succeeded!` })
  }
  process.exit(0)
}

createIndex().catch((err) => {
  logger.logFullError(err, { component: 'createIndex' })
  process.exit(1)
})
