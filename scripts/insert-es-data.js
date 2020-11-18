/**
 * Import data into ES.
 */
const config = require('config')
const _ = require('lodash')
const logger = require('../src/common/logger')
const helper = require('../src/common/helper')

const jobs = [
  {
    id: '1d9e8c1a-e653-4d31-a799-2685e41da212',
    projectId: 9050,
    externalId: '1212',
    description: 'Dummy Description',
    startDate: '2020-09-27T04:17:23.131Z',
    endDate: '2020-10-17T04:17:23.131Z',
    numPositions: 13,
    resourceType: 'Dummy Resource Type',
    rateType: 'hourly',
    skills: [
      'cb01fd31-e8d2-4e34-8bf3-b149705de3e1',
      '59ee7b42-f3f3-48c9-bdca-e8396b241793',
      '1b585c26-2649-4078-8369-b599fe6a9d75',
      '8b757998-ff7d-4b3a-9fee-a49d3e41da03',
      'bcfc8806-cae6-47ff-b0c9-f604acfc8c99'
    ],
    status: 'sourcing',
    createdAt: '2020-11-11T04:17:23.131Z',
    createdBy: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a'
  },
  {
    id: '1d9e8c1a-e653-4d31-a799-2685e41da213',
    projectId: 9056,
    externalId: '1212',
    description: 'Dummy Description',
    startDate: '2020-09-29T04:17:23.131Z',
    endDate: '2020-10-17T04:17:23.131Z',
    numPositions: 11,
    resourceType: 'Dummy Resource Type',
    rateType: 'hourly',
    skills: [
      'cb01fd31-e8d2-4e34-8bf3-b149705de3e1',
      '59ee7b42-f3f3-48c9-bdca-e8396b241793',
      'bcfc8806-cae6-47ff-b0c9-f604acfc8c99'
    ],
    status: 'sourcing',
    createdAt: '2020-11-11T04:17:23.131Z',
    createdBy: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a'
  },
  {
    id: '1d9e8c1a-e653-4d31-a799-2685e41da214',
    projectId: 9063,
    externalId: '1212',
    description: 'Dummy Description',
    startDate: '2020-09-17T04:17:23.131Z',
    endDate: '2020-10-19T04:17:23.131Z',
    numPositions: 20,
    resourceType: 'Dummy Resource Type',
    rateType: 'hourly',
    skills: [
      '8b757998-ff7d-4b3a-9fee-a49d3e41da03',
      'bcfc8806-cae6-47ff-b0c9-f604acfc8c99'
    ],
    status: 'sourcing',
    createdAt: '2020-11-11T04:17:23.131Z',
    createdBy: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a'
  },
  {
    id: '1d9e8c1a-e653-4d31-a799-2685e41da215',
    projectId: 9063,
    externalId: '1212',
    description: 'Dummy Description',
    startDate: '2020-09-27T04:17:23.131Z',
    endDate: '2020-10-09T04:17:23.131Z',
    numPositions: 10,
    resourceType: 'Dummy Resource Type',
    rateType: 'hourly',
    skills: [
      '1b585c26-2649-4078-8369-b599fe6a9d75',
      'bcfc8806-cae6-47ff-b0c9-f604acfc8c99'
    ],
    status: 'sourcing',
    createdAt: '2020-11-11T04:17:23.131Z',
    createdBy: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a'
  }
]

const jobCandidates = [
  {
    id: '2d9e8c1a-e653-4d31-a799-2685e41da212',
    jobId: '1d9e8c1a-e653-4d31-a799-2685e41da212',
    userId: '5bd69a82-c2cb-476f-9462-0883d3b28b90',
    status: 'open',
    createdAt: '2020-11-11T04:17:23.131Z',
    createdBy: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a'
  },
  {
    id: '2d9e8c1a-e653-4d31-a799-2685e41da213',
    jobId: '1d9e8c1a-e653-4d31-a799-2685e41da213',
    userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
    status: 'open',
    createdAt: '2020-11-11T04:17:23.131Z',
    createdBy: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a'
  },
  {
    id: '2d9e8c1a-e653-4d31-a799-2685e41da214',
    jobId: '1d9e8c1a-e653-4d31-a799-2685e41da214',
    userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
    status: 'open',
    createdAt: '2020-11-11T04:17:23.131Z',
    createdBy: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a'
  }
]

const resourceBookings = [
  {
    id: '3d9e8c1a-e653-4d31-a799-2685e41da212',
    projectId: 9050,
    userId: '39203872-707a-41b8-a587-18cab2557632',
    jobId: '1d9e8c1a-e653-4d31-a799-2685e41da212',
    startDate: '2020-09-27T04:17:23.131Z',
    endDate: '2021-11-11T04:17:23.131Z',
    memberRate: 13.23,
    customerRate: 13,
    rateType: 'hourly',
    status: 'assigned',
    createdAt: '2020-11-11T04:17:23.131Z',
    createdBy: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a'
  },
  {
    id: '3d9e8c1a-e653-4d31-a799-2685e41da213',
    projectId: 9050,
    userId: '10803918-ded0-4906-9442-65dc8819de91',
    jobId: '1d9e8c1a-e653-4d31-a799-2685e41da212',
    startDate: '2020-09-22T04:17:23.131Z',
    endDate: '2020-10-27T04:17:23.131Z',
    memberRate: 13.23,
    customerRate: 14.5,
    rateType: 'hourly',
    status: 'assigned',
    createdAt: '2020-11-11T04:17:23.131Z',
    createdBy: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a'
  },
  {
    id: '3d9e8c1a-e653-4d31-a799-2685e41da214',
    projectId: 9050,
    userId: '5bd69a82-c2cb-476f-9462-0883d3b28b90',
    jobId: '1d9e8c1a-e653-4d31-a799-2685e41da212',
    startDate: '2020-09-28T04:17:23.131Z',
    endDate: '2020-12-30T04:17:23.131Z',
    memberRate: 13.23,
    customerRate: 16.7,
    rateType: 'hourly',
    status: 'assigned',
    createdAt: '2020-11-11T04:17:23.131Z',
    createdBy: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a'
  },
  {
    id: '3d9e8c1a-e653-4d31-a799-2685e41da215',
    projectId: 9056,
    userId: '39203872-707a-41b8-a587-18cab2557632',
    jobId: '1d9e8c1a-e653-4d31-a799-2685e41da215',
    startDate: '2020-09-28T04:17:23.131Z',
    endDate: '2020-12-30T04:17:23.131Z',
    memberRate: 13.23,
    customerRate: 156.7,
    rateType: 'hourly',
    status: 'assigned',
    createdAt: '2020-11-11T04:17:23.131Z',
    createdBy: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a'
  },
  {
    id: '3d9e8c1a-e653-4d31-a799-2685e41da216',
    projectId: 9063,
    userId: '4f2dc463-e24b-4b4a-8cde-c0122fbfb8ac',
    jobId: '1d9e8c1a-e653-4d31-a799-2685e41da216',
    startDate: '2020-09-28T04:17:23.131Z',
    endDate: '2020-12-30T04:17:23.131Z',
    memberRate: 13.23,
    customerRate: 11.11,
    rateType: 'hourly',
    status: 'assigned',
    createdAt: '2020-11-11T04:17:23.131Z',
    createdBy: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a'
  }
]

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
