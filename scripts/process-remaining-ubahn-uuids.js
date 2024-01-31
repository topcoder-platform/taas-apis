const models = require('../src/models')
const tcUserId = require('./common/tcUserId')
const Sequelize = require('sequelize')
const _ = require('lodash')
const helper = require('../src/common/helper')
const request = require('superagent')
const config = require('config')

/**
 *
 * @param {string} handle - The member handle
 * @returns {Promise<object>} The member details from the member API
 */
async function getMemberDetailsByHandle (handle) {
  const token = await helper.getM2MToken()
  let res
  try {
    res = await request
      .get(`${config.TOPCODER_MEMBERS_API}/${handle}`)
      .query({
        fields: 'userId,handle,handleLower'
      })
      .set('Authorization', `Bearer ${token}`)
      .set('Accept', 'application/json')
    return res.body
  } catch (error) {
    console.log(`Unable to find member with handle ${handle}`)
    return {}
  }
}

const processRemainingUUIDs = async (tableName, columnNames) => {
  const dbUrl = process.env.UBAHN_DB_URL
  const MODE = process.env.MODE || 'test'
  const handleToIDMap = {}

  if (_.isUndefined(dbUrl) || _.isNull(dbUrl)) {
    console.log('Ubahn DB URL not set, exiting!')
    process.exit(0)
  }

  // only for readability
  console.log()
  console.log('---------------------------------------------------------------------------------------------------------------')
  console.log()

  for (const columnName of _.split(columnNames, ',')) {
    const transaction = await models.sequelize.transaction()

    try {
      // check each column to find distinct existing uuids which have not yet been converted to TC legacy user id
      const query = `SELECT DISTINCT ${columnName} FROM bookings.${tableName} WHERE LENGTH(${columnName}) > 9 AND ${columnName} <> '00000000-0000-0000-0000-000000000000';`
      console.log(`Executing query in table ${tableName} against column ${columnName}`)
      console.log(`SQL query: ${query}`)
      let results = await models.sequelize.query(query, { type: Sequelize.QueryTypes.SELECT })

      if (results.length > 0) {
        results = _.uniq(_.map(_.filter(results, val => toString(val[`${columnName}`]).length > 9), val => val[`${columnName}`]))
        console.log(`SQL query result: ${JSON.stringify(results)}`)

        // get the ubahn uuid to handle map
        const ubahnConn = await tcUserId.getUbahnDatabaseConnection(dbUrl)
        const uuidToHandleMap = await tcUserId.getUserUbahnUUIDToHandleMap(ubahnConn, results)

        // get the handle to legacy topcoder id map
        for (const handle of Object.values(uuidToHandleMap)) {
          console.log(`handle to search for ${handle}`)
          if (_.isUndefined(handleToIDMap[handle])) {
            const member = await getMemberDetailsByHandle(handle)
            handleToIDMap[member.handleLower] = member.userId
          }
        }

        // build the update queries
        let sql = ''
        for (const [key, value] of Object.entries(uuidToHandleMap)) {
          if (!_.isUndefined(handleToIDMap[value.toLowerCase()])) {
            sql += `UPDATE bookings.${tableName} SET ${columnName} = '${handleToIDMap[value.toLowerCase()]}' WHERE ${columnName} = '${key}';`
          }
        }

        // execute update queries if and only if it's not in test mode
        if (sql !== '') {
          console.log(`SQL UPDATE statements: ${sql}`)
          if (MODE !== 'test') {
            console.log('Executing UPDATE statements')
            await models.sequelize.query(sql, { type: Sequelize.QueryTypes.UPDATE, transaction: transaction })
          }
        } else {
          console.log(`No UPDATE statements to execute against column ${columnName}`)
        }
      } else {
        console.log(`No data eligible to be updated for table: ${tableName} against column ${columnName}`)
      }

      // only for readability
      console.log('---------------------------------------------------------------------------------------------------------------')
      console.log()

      await transaction.commit()
    } catch (error) {
      console.log('Error encountered')
      console.error(JSON.stringify(error))
      await transaction.rollback()
    }
  }

  console.log(`DONE processing table ${tableName}`)
}

// read cli arguments, pass the table name
const tableName = process.argv[2]
// read cli arguments, pass the column names to update
const columnNames = process.argv[3]

processRemainingUUIDs(tableName, columnNames).then(res => {
  console.log(`Processed remaining records for model '${tableName}' against columns: ${columnNames}`)
  process.exit(0)
}).catch(err => {
  console.log('Error encountered!')
  console.error(`${JSON.stringify(err)}`)
  process.exit(1)
})
