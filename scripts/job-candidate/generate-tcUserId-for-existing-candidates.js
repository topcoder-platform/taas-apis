const Sequelize = require('sequelize')
const _ = require('lodash')
const models = require('../../src/models')
const helper = require('../../src/common/helper')
const logger = require('../../src/common/logger')
const config = require('config')

// The number of job candidates to process in a single batch
const JOB_CANDIDATES_BATCH_SIZE = Number(process.env.JOB_CANDIDATES_BATCH_SIZE) || 500

// This will hold the mapping between the member handles and Topcoder legacy user ids
// This will be loaded from static json files, the handles to userid is unlikely to change
// If the handle is not found in this mapping file, then member-api will be used to fetch it
// This will reduce the number of calls to make to member-api when running the script
let handleToUserIdMap

if (process.env.NODE_ENV === 'development') {
  handleToUserIdMap = require('./data/dev/dev_candidates_handle_to_userId.map.json')
} else if (process.env.NODE_ENV === 'production') {
  handleToUserIdMap = require('./data/prod/prod_candidates_handle_to_userId.map.json')
} else {
  console.log('NODE_ENV should be one of \'development\' or \'production\' - Exiting!!')
  process.exit(0)
}

/**
 * This script will populate the tc_user_id field for all the existing job candidates
 * This is a one time use script which loads the users data from u-bahn database and
 * populates the tc_user_id based on ubahn user UUID
 *
 * In addition to the taas-apis configuration parameters, this script requires the following environment variable:
 * - UBAHN_DB_URL: The ubahn database URL
 */
const generateTcUserIdForExistingCandidates = async () => {
  const dbUrl = process.env.UBAHN_DB_URL
  if (_.isUndefined(dbUrl)) {
    console.log('UBAHN_DB_URL environment variable is required to be set. Exiting!!')
    return
  }

  // Get the list of job candidates from TaaS database where ubahn user UUID is not null
  const jobCandidates = await models.JobCandidate.findAll({
    attributes: ['id', 'userId'], // userId refers to UUID in Ubahn
    where: {
      userId: {
        [Sequelize.Op.ne]: null
      }
    },
    distinct: true
  })

  // Get the mapping between the Ubahn user UUID and user handle
  const ubahnDbConnection = await getUbahnDatabaseConnection(dbUrl)
  const ubahnUUIDToHandleMap = await getUserUbahnUUIDToHandleMap(ubahnDbConnection, jobCandidates)
  await ubahnDbConnection.close()

  // split the candidates to update in chunks
  const candidatesBatches = _.chunk(jobCandidates, JOB_CANDIDATES_BATCH_SIZE)

  // process job candidate batches in sequence
  for (const candidatesBatch of candidatesBatches) {
    // Prepare the data for updating the candidates in the current batch in parallel
    const candidatesToUpdateInTaasDbPromises = _.map(candidatesBatch, async candidate => {
      const handle = ubahnUUIDToHandleMap[candidate.userId]
      if (!_.isUndefined(handle)) {
        // Get the member legacy user_id from the map
        let tcUserId = handleToUserIdMap[handle]
        if (_.isUndefined(tcUserId)) {
          // Get the member details from member-api if it is not in the mapping file
          const [memberDetails] = await helper.getMemberDetailsByHandles([handle])
          if (!memberDetails) {
            logger.info(`member details for handle ${ubahnUUIDToHandleMap[candidate.userId]} does not exist`)
            return null
          } else {
            tcUserId = memberDetails.userId
          }
        }
        return {
          id: candidate.id,
          tcUserId
        }
      } else {
        logger.info(`handle for user UUID ${candidate.userId} does not exist`)
        return null
      }
    })

    // wait for all promises to resolve
    let candidatesToUpdateInTaasDB = await Promise.all(candidatesToUpdateInTaasDbPromises)

    // remove null values (i.e where member details does not exist)
    candidatesToUpdateInTaasDB = _.filter(candidatesToUpdateInTaasDB, c => !_.isNull(c))

    // Generate SQL statements to update tc_user_id for the current users batch in Postgres
    // bulkUpdate is not supported by sequelize, we perform the update using SQL
    let updateBatchTcUserIdsSQL = ''
    for (const candidateToUpdate of candidatesToUpdateInTaasDB) {
      updateBatchTcUserIdsSQL +=
        `UPDATE bookings.job_candidates SET tc_user_id=${candidateToUpdate.tcUserId} WHERE id = '${candidateToUpdate.id}';`
    }

    // Run the query to update job_candidates.tc_user_id in TaaS PostgreSQL DB for all the users in current batch
    await models.sequelize.query(updateBatchTcUserIdsSQL)

    // update the candidates in Elasticsearch
    await bulkUpdateJobCandidatesInElasticsearch(candidatesToUpdateInTaasDB)
  }
}

/**
 * This function gets the mapping between UBAHN user ids and Topcoder handles
 * The return value is a Promise of a Map between user ubahn ids and Topcoder handles:
 * {
 *   "a55fe1bc-1754-45fa-9adc-cf3d6d7c377a": "pshah_manager",
 *   "95e7970f-12b4-43b7-ab35-38c34bf033c7": "testfordevemail"
 * }
 * @param connection - The Ubahn database connection object
 * @param jobCandidates - The list of job candidates objects we are interested in, each object should have `userId` field
 *                        Which represents the user UUID in UBAHN
 */
const getUserUbahnUUIDToHandleMap = async (connection, jobCandidates) => {
  // filter by unique not null userIds
  const uniqUserIds = _.filter(_.uniqBy(jobCandidates, c => c.userId), c => !_.isNull(c.userId))

  const commaSeparatedUbahnUUIDs = _.join(_.map(uniqUserIds, u => `'${u.userId}'`), ',')

  const query = `SELECT id, handle from "Users" where id in (${commaSeparatedUbahnUUIDs})`
  const userUUIDsWithHandles = await connection.query(query, { type: Sequelize.QueryTypes.SELECT })

  const ubahnIdToHandleMap = {}
  for (const userUbahnDetails of userUUIDsWithHandles) {
    ubahnIdToHandleMap[userUbahnDetails.id] = userUbahnDetails.handle
  }

  return ubahnIdToHandleMap
}

/**
 * Gets the connection object to the Ubahn PostgreSQL Database
 * @param url - The Ubahn PostgreSQL database url
 */
const getUbahnDatabaseConnection = async (url) => {
  return new Sequelize(url)
}

/**
 * This function updates the list of given job candidates in bulk in Elasticsearch
 *
 * @param candidates - The array of job candidates to update, example of input parameter is:
 *        id is the id of job candidate record in TaaS DB / Elasticsearch, not to be mixed with ubahn uuid
 * [
 *   {
 *     "id": "827ee401-df04-42e1-abbe-7b97ce7937ff",
 *     "tcUserId": 88774631
 *   },
 *   {
 *     "id": "a4ea7bcf-5b99-4381-b99c-a9bd05d83a36",
 *     "tcUserId": 88774631
 *   },
 *   {
 *     "id": "b0fc417b-3f41-4c06-9f2b-8e680c3a03c6",
 *     "tcUserId": 40152856
 *   }
 * ]
 */
const bulkUpdateJobCandidatesInElasticsearch = async (candidates) => {
  const esClient = await helper.getESClient()
  const body = []

  for (const candidate of candidates) {
    body.push({
      update: {
        _id: candidate.id,
        _index: config.esConfig.ES_INDEX_JOB_CANDIDATE
      }
    })

    body.push({
      doc: { ...candidate }
    })
  }

  try {
    logger.debug(`Bulk update job candidates in ES - body =${JSON.stringify(body)}`)
    const result = await esClient.bulk({
      refresh: false,
      body
    })
    logger.debug(`Result of job candidates bulk updates = ${JSON.stringify(result)}`)
    if (result.errors) {
      logger.info(`Job candidates bulk update in ES has errors - result = ${JSON.stringify(result)}`)
    }
  } catch (err) {
    logger.error('Error when bulk updating job candidates in ES')
    logger.error(err)
  }
}

generateTcUserIdForExistingCandidates().then(res => {
  console.log('tc_user_id is successfully populated for all job candidates in TaaS database')
  process.exit(0)
}).catch(err => {
  console.log('An error occurred when populating the tc_user_id fields for job candidates')
  console.log(err)
})
