const models = require('../src/models')
const tcUserId = require('./common/tcUserId')
const Sequelize = require('sequelize')
const _ = require('lodash')
const helper = require('../src/common/helper')

// read cli arguments, pass the table name
const tableName = process.argv[2]
// read cli arguments, pass the column names to update
const columnNames = process.argv[3]

const processRemainingUUIDs = async (tableName, columnNames) => {
  const dbUrl = process.env.UBAHN_DB_URL
  const MODE = process.env.MODE || 'test'

  if (_.isUndefined(dbUrl) || _.isNull(dbUrl)) {
    console.log('Ubahn DB URL not set, exiting!')
    process.exit(0)
  }

  for (const columnName of _.split(columnNames, ',')) {
    const query = `SELECT DISTINCT ${columnName} FROM bookings.${tableName} WHERE LENGTH(${columnName}) > 9 AND ${columnName} <> '00000000-0000-0000-0000-000000000000';`
    let results = await models.sequelize.query(query, { type: Sequelize.QueryTypes.SELECT })

    if (results.length > 0) {
      results = _.uniq(_.map(_.filter(results, val => toString(val[`${columnName}`]).length > 9), val => val[`${columnName}`]))
      console.log(`result: ${JSON.stringify(results)}`)

      const ubahnConn = await tcUserId.getUbahnDatabaseConnection(dbUrl)
      const uuidToHandleMap = await tcUserId.getUserUbahnUUIDToHandleMap(ubahnConn, results)

      const handleToIDMap = {}
      const batches = _.chunk(Object.values(uuidToHandleMap), 30)
      for (const batch of batches) {
        const memberAPIRes = await helper.getMemberDetailsByHandles(batch)
        _.forEach(memberAPIRes, member => {
          handleToIDMap[member.handleLower] = member.userId
        })
      }

      let sql = ''
      for (const [key, value] of Object.entries(uuidToHandleMap)) {
        if (!_.isUndefined(handleToIDMap[value.toLowerCase()])) {
          sql += `UPDATE bookings.${tableName} SET ${columnName} = ${handleToIDMap(value)} WHERE ${columnName} = ${key};`
        }
      }
      console.log(`UPDATE statements: ${sql}`)
      if (MODE !== test) {
        await models.sequelize.query(sql, { type: Sequelize.QueryTypes.UPDATE })
      }
    } else {
      console.log(`No data eligible to be updated for table: ${tableName} against column ${columnName}`)
    }
  }
}

processRemainingUUIDs(tableName, columnNames).then(res => {
  console.log(`Processed remaining records for model '${tableName}' against columns: ${columnNames}`)
  process.exit(0)
}).catch(err => {
  console.error(`${JSON.stringify(err)}`)
  process.exit(1)
})
