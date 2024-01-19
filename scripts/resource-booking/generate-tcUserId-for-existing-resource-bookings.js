const Sequelize = require('sequelize')
const _ = require('lodash')
const models = require('../../src/models')
const helper = require('../../src/common/helper')
const logger = require('../../src/common/logger')

// The number of resource booking records to process in a single batch
const PROCESSING_BATCH_SIZE = Number(process.env.PROCESSING_BATCH_SIZE) || 500

// This will hold the mapping between the member handles and Topcoder legacy user ids
// This will be loaded from static json files, the handles to userid is unlikely to change
// If the handle is not found in this mapping file, then member-api will be used to fetch it
// This will reduce the number of calls to make to member-api when running the script
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
 * This script will populate the tc_user_id field for all the existing resource booking user ids (uuids)
 * along with converting the created_by and updated_by uuids to topcoder legacy user ids
 * This is a one time use script which loads the users data from u-bahn database and
 * populates the tc_user_id based on ubahn user UUID
 *
 * In addition to the taas-apis configuration parameters, this script requires the following environment variable:
 * - UBAHN_DB_URL: The ubahn database URL
 */
const generateTcUserIdForExistingResourceBookings = async () => {
  const dbUrl = process.env.UBAHN_DB_URL
  if (_.isUndefined(dbUrl)) {
    console.log('UBAHN_DB_URL environment variable is required to be set. Exiting!!')
    process.exit(1)
  }

  // Get the list of resource bookings from TaaS database where ubahn user UUID is not null
  const resourceBookings = await models.ResourceBooking.findAll({
    attributes: ['id', 'userId', 'createdBy', 'updatedBy'], // userId refers to UUID in Ubahn
    where: {
      userId: {
        [Sequelize.Op.ne]: null
      }
    },
    distinct: true
  })

  // Get the mapping between the Ubahn user UUID and user handle
  const ubahnDbConnection = await getUbahnDatabaseConnection(dbUrl)
  const ubahnUUIDToHandleMap = await getUserUbahnUUIDToHandleMap(ubahnDbConnection, resourceBookings)
  await ubahnDbConnection.close()

  // split the resource bookings in order to update in chunks
  const resourceBookingBatches = _.chunk(resourceBookings, PROCESSING_BATCH_SIZE)

  // process resource booking batches in sequence
  for (const resourceBookingBatch of resourceBookingBatches) {
    // Prepare the data for updating the resource bookings in the current batch in parallel
    const resourceBookingsToUpdateInTaasDbPromises = _.map(resourceBookingBatch, async resourceBooking => {
      const userHandle = ubahnUUIDToHandleMap[resourceBooking.userId]
      const createdByHandle = ubahnUUIDToHandleMap[resourceBooking.createdBy]
      const updatedByHandle = ubahnUUIDToHandleMap[resourceBooking.updatedBy]

      let tcUserId, tcCreatedById, tcUpdatedById

      // get the user id
      if (!_.isUndefined(userHandle)) {
        // Get the member legacy user_id from the map
        tcUserId = handleToUserIdMap[userHandle]
        if (_.isUndefined(tcUserId)) {
          // Get the member details from member-api if it is not in the mapping file
          const [memberDetails] = await helper.getMemberDetailsByHandles([userHandle])
          if (!memberDetails) {
            logger.info(`member details for handle ${userHandle} does not exist`)
            tcUserId = null
          } else {
            tcUserId = memberDetails.userId
          }
        }
      } else {
        logger.info(`handle for user UUID ${resourceBooking.userId} does not exist`)
        tcUserId = null
      }

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
        logger.info(`handle for user UUID ${resourceBooking.createdBy} does not exist`)
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
        logger.info(`handle for user UUID ${resourceBooking.updatedBy} does not exist`)
        tcUpdatedById = null
      }

      const resourceBookingId = resourceBooking.id
      return {
        resourceBookingId,
        tcUserId,
        tcCreatedById,
        tcUpdatedById
      }
    })

    // wait for all promises to resolve
    let resourceBookingsToUpdateInTaasDB = await Promise.all(resourceBookingsToUpdateInTaasDbPromises)

    // remove null values (i.e where member details does not exist)
    resourceBookingsToUpdateInTaasDB = _.filter(resourceBookingsToUpdateInTaasDB, rb => !_.isNull(rb.tcUserId) && !_.isNull(rb.tcCreatedById) && !_.isNull(rb.tcUpdatedById))

    // Generate SQL statements to update tc_user_id for the current users batch in Postgres
    // bulkUpdate is not supported by sequelize, we perform the update using SQL
    let updateBatchTcUserIdsSQL = ''
    for (const resourceBookingToUpdate of resourceBookingsToUpdateInTaasDB) {
      let sqlPrefix = 'UPDATE bookings.resource_bookings SET '
      if (resourceBookingToUpdate.tcUserId !== null) {
        sqlPrefix += `tc_user_id = ${resourceBookingToUpdate.tcUserId}`
      }
      if (resourceBookingToUpdate.tcCreatedById !== null) {
        sqlPrefix += ` created_by = '${resourceBookingToUpdate.tcCreatedById}'`
      }
      if (resourceBookingToUpdate.tcUpdatedById !== null) {
        sqlPrefix += ` updated_by = '${resourceBookingToUpdate.tcUpdatedById}'`
      }
      sqlPrefix += ` WHERE id = '${resourceBookingToUpdate.resourceBookingId}';`
      updateBatchTcUserIdsSQL += sqlPrefix
    }

    // Run the query to update resource_bookings record in batch
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
 * @param resourceBookings - The list of resource bookings objects we are interested in, each object should have `userId` field
 *                        Which represents the user UUID in UBAHN
 */
const getUserUbahnUUIDToHandleMap = async (connection, resourceBookings) => {
  // filter by unique not null userIds
  const uniqUserIds = _.map(_.filter(_.uniqBy(resourceBookings, rb => rb.userId), rb => !_.isNull(rb.userId)), val => val.userId)
  const uniqCreatedByIds = _.map(_.filter(_.uniqBy(resourceBookings, rb => rb.createdBy), rb => !_.isNull(rb.createdBy)), val => val.createdBy)
  const uniqUpdatedByByIds = _.map(_.filter(_.uniqBy(resourceBookings, rb => rb.updatedBy), rb => !_.isNull(rb.updatedBy)), val => val.updatedBy)

  const uniqueUUIDs = _.uniq(_.concat(uniqUserIds, uniqCreatedByIds, uniqUpdatedByByIds))

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

generateTcUserIdForExistingResourceBookings().then(res => {
  console.log('tc_user_id, created_by and updated_by is successfully populated for all resource bookings in TaaS database')
  process.exit(0)
}).catch(err => {
  console.log('An error occurred when populating the tc_user_id, created_by and updated_by fields for resource bookings')
  console.log(err)
  process.exit(1)
})
