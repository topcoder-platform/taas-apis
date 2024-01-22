const Sequelize = require('sequelize')
const _ = require('lodash')
const models = require('../../src/models')
const helper = require('../../src/common/helper')
const logger = require('../../src/common/logger')

// The number of interview records to process in a single batch
const PROCESSING_BATCH_SIZE = Number(process.env.PROCESSING_BATCH_SIZE) || 500

// This will hold the mapping between the member handles and Topcoder legacy user ids
// This will be loaded from static json files, the handles to userid is unlikely to change
// If the handle is not found in this mapping file, then member-api will be used to fetch it
// This will reduce the number of calls made to member-api when running the script
let handleToUserIdMap

if (process.env.NODE_ENV === 'development') {
  handleToUserIdMap = require('../data/dev/dev_handle_to_userId.map.json')
} else if (process.env.NODE_ENV === 'production') {
  handleToUserIdMap = require('../data/prod/prod_handle_to_userId.map.json')
} else {
  console.log('NODE_ENV should be one of \'development\' or \'production\' - Exiting!!')
  process.exit(1)
}

/**
 * This script will populate the created_by and updated_by uuids to topcoder legacy user ids
 * This is a one time use script which loads the users data from u-bahn database and
 * populates the tc legacy user id based on ubahn user UUID
 *
 * In addition to the taas-apis configuration parameters, this script requires the following environment variable:
 * - UBAHN_DB_URL: The ubahn database URL
 */
const generateTcUserIdForExistingInterviews = async () => {
  const dbUrl = process.env.UBAHN_DB_URL
  if (_.isUndefined(dbUrl)) {
    console.log('UBAHN_DB_URL environment variable is required to be set. Exiting!!')
    process.exit(1)
  }

  // Get the list of interviews from TaaS database
  const interviews = await models.Interview.findAll({
    attributes: ['id', 'createdBy', 'updatedBy'],
    distinct: true
  })

  // Get the mapping between the Ubahn user UUID and user handle
  const ubahnDbConnection = await getUbahnDatabaseConnection(dbUrl)
  const ubahnUUIDToHandleMap = await getUserUbahnUUIDToHandleMap(ubahnDbConnection, interviews)
  await ubahnDbConnection.close()

  // split the job candidates in order to update in chunks
  const interviewBatches = _.chunk(interviews, PROCESSING_BATCH_SIZE)

  // process record booking batches in sequence
  for (const interviewBatch of interviewBatches) {
    // Prepare the data for updating the job candidates in the current batch in parallel
    const interviewToUpdateInTaasDbPromises = _.map(interviewBatch, async interview => {
      const createdByHandle = ubahnUUIDToHandleMap[interview.createdBy]
      const updatedByHandle = ubahnUUIDToHandleMap[interview.updatedBy]

      let tcCreatedById, tcUpdatedById

      // get the createdBy id
      if (!_.isUndefined(createdByHandle)) {
        // Get the member legacy user_id from the map
        tcCreatedById = handleToUserIdMap[createdByHandle]
        if (_.isUndefined(tcCreatedById)) {
          // Get the member details from member-api if it is not in the mapping file
          const [memberDetails] = await helper.getMemberDetailsByHandles([createdByHandle])
          if (!memberDetails) {
            logger.info(`member details for handle ${createdByHandle} does not exist`)
            tcCreatedById = null
          } else {
            tcCreatedById = memberDetails.userId
          }
        }
      } else {
        logger.info(`handle for user UUID ${interview.createdBy} does not exist`)
        tcCreatedById = null
      }

      // get the updatedBy id
      if (!_.isUndefined(updatedByHandle)) {
        // Get the member legacy user_id from the map
        tcUpdatedById = handleToUserIdMap[updatedByHandle]
        if (_.isUndefined(tcUpdatedById)) {
          // Get the member details from member-api if it is not in the mapping file
          const [memberDetails] = await helper.getMemberDetailsByHandles([updatedByHandle])
          if (!memberDetails) {
            logger.info(`member details for handle ${updatedByHandle} does not exist`)
            tcUpdatedById = null
          } else {
            tcUpdatedById = memberDetails.userId
          }
        }
      } else {
        logger.info(`handle for user UUID ${interview.updatedBy} does not exist`)
        tcUpdatedById = null
      }

      const interviewId = interview.id
      return {
        interviewId,
        tcCreatedById,
        tcUpdatedById
      }
    })

    // wait for all promises to resolve
    let interviewsToUpdateInTaasDB = await Promise.all(interviewToUpdateInTaasDbPromises)

    // remove null values (i.e where member details does not exist)
    interviewsToUpdateInTaasDB = _.filter(interviewsToUpdateInTaasDB, i => !_.isNull(i.tcCreatedById) && !_.isNull(i.tcUpdatedById))

    // Generate SQL statements to update created_by and updated_by for the current users batch in Postgres
    // bulkUpdate is not supported by sequelize, we perform the update using SQL
    let updateBatchTcUserIdsSQL = ''
    for (const interviewToUpdate of interviewsToUpdateInTaasDB) {
      let sqlPrefix = 'UPDATE bookings.interviews SET '
      if (interviewToUpdate.tcCreatedById !== null) {
        sqlPrefix += `created_by = '${interviewToUpdate.tcCreatedById}'`
      }
      if (interviewToUpdate.tcUpdatedById !== null) {
        sqlPrefix += `, updated_by = '${interviewToUpdate.tcUpdatedById}'`
      }
      sqlPrefix += ` WHERE id = '${interviewToUpdate.interviewId}';`
      updateBatchTcUserIdsSQL += sqlPrefix
    }

    // Run the query to update record_bookings record in batch
    await models.sequelize.query(updateBatchTcUserIdsSQL)
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
 * @param interviews - The list of job candidate objects we are interested in, each object should have `userId` field
 *                        Which represents the user UUID in UBAHN
 */
const getUserUbahnUUIDToHandleMap = async (connection, interviews) => {
  // filter by unique not null userIds
  const uniqCreatedByIds = _.map(_.filter(_.uniqBy(interviews, i => i.createdBy), i => !_.isNull(i.createdBy)), val => val.createdBy)
  const uniqUpdatedByByIds = _.map(_.filter(_.uniqBy(interviews, i => i.updatedBy), i => !_.isNull(i.updatedBy)), val => val.updatedBy)

  const uniqueUUIDs = _.uniq(_.concat(uniqCreatedByIds, uniqUpdatedByByIds))

  const commaSeparatedUbahnUUIDs = _.join(_.map(uniqueUUIDs, u => `'${u}'`), ',')

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

generateTcUserIdForExistingInterviews().then(res => {
  console.log('created_by and updated_by has been successfully populated for all interviews in TaaS database')
  process.exit(0)
}).catch(err => {
  console.log('An error occurred when populating the created_by and updated_by fields for interviews')
  console.log(err)
  process.exit(1)
})
