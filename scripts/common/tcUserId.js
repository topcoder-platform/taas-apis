const Sequelize = require('sequelize')
const _ = require('lodash')
const helper = require('../../src/common/helper')

/**
 * This function gets the mapping between UBAHN user ids and Topcoder handles
 * The return value is a Promise of a Map between user ubahn ids and Topcoder handles:
 * {
 *   "a55fe1bc-1754-45fa-9adc-cf3d6d7c377a": "pshah_manager",
 *   "95e7970f-12b4-43b7-ab35-38c34bf033c7": "testfordevemail"
 * }
 * @param connection - The Ubahn database connection object
 * @param uniqueUUIDs - The list of records with UUIDs in UBAHN
 */
const getUserUbahnUUIDToHandleMap = async (connection, uniqueUUIDs) => {
  // make sure we are working with unique array of UUIDs
  const _uniqueUUIDs = _.uniq(uniqueUUIDs)

  const commaSeparatedUbahnUUIDs = _.join(_.map(_uniqueUUIDs, u => `'${u}'`), ',')

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

const getTcUserIdByHandle = async (handle) => {
  let handleToUserIdMap

  if (process.env.NODE_ENV === 'development') {
    handleToUserIdMap = require('../data/dev/dev_handle_to_userId.map.json')
  } else if (process.env.NODE_ENV === 'production') {
    handleToUserIdMap = require('../data/prod/prod_handle_to_userId.map.json')
  } else {
    console.log('NODE_ENV should be one of \'development\' or \'production\' - Exiting!!')
    process.exit(1)
  }

  let tcCreatedById = handleToUserIdMap[handle]

  if (_.isUndefined(tcCreatedById)) {
    // Get the member details from member-api if it is not in the mapping file
    const [memberDetails] = await helper.getMemberDetailsByHandles([handle])
    if (!memberDetails) {
      tcCreatedById = ''
    } else {
      tcCreatedById = memberDetails.userId
    }
  }

  return toString(tcCreatedById)
}

module.exports = {
  getUbahnDatabaseConnection,
  getUserUbahnUUIDToHandleMap,
  getTcUserIdByHandle
}
