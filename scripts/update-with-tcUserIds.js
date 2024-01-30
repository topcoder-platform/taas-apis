const models = require('../src/models')
const tcUserId = require('./common/tcUserId')
const Sequelize = require('sequelize')
const _ = require('lodash')

const updateTableWithTcUserIds = async (tableName, columnNames) => {
  console.log(`Updating table "${tableName}" with tcUserIds at "${columnNames}"...`)

  const dbUrl = process.env.UBAHN_DB_URL
  const MODE = process.env.MODE || 'test'

  if (_.isUndefined(dbUrl)) {
    console.log('UBAHN_DB_URL environment variable is required to be set. Exiting!!')
    process.exit(1)
  }

  // Get the mapping between the Ubahn user UUID and user handle
  const ubahnDbConnection = await tcUserId.getUbahnDatabaseConnection(dbUrl)
  // get all records from resource_bookings table
  const recordsToProcess = await models.sequelize.query(
    `SELECT id,${columnNames} FROM ${tableName};`,
    { type: Sequelize.QueryTypes.SELECT }
  )

  console.log(`Found ${recordsToProcess.length} records to process`)

  // get list of unique user ids from all columNames
  const columns = columnNames.split(',')
  const userIds = _.compact(
    _.filter(
      _.uniq(
        _.flatten(
          _.map(recordsToProcess, record => _.values(_.pick(record, columns)))
        )
      ), uuid => uuid !== '00000000-0000-0000-0000-000000000000' && !Number(uuid)
    )
  )

  console.log(`Found ${userIds.length} unique user ids. Converting to TC handles...`)

  // get mapping between uuid and handle
  const uuidToHandleMap = await tcUserId.getUserUbahnUUIDToHandleMap(ubahnDbConnection, userIds)
  // close ubahn db connection
  await ubahnDbConnection.close()

  // create a transaction
  const transaction = await models.sequelize.transaction()

  try {
    // update roles with tc user ids
    for (const record of recordsToProcess) {
      const columnsToUserIdsMap = {}

      console.log(`Processing record ${JSON.stringify(record)}`)

      for (const column of columns) {
        columnsToUserIdsMap[column] = uuidToHandleMap[record[column]]

        if (_.isUndefined(columnsToUserIdsMap[column])) {
          console.log('\x1b[33m%s\x1b[0m', `Could not find mapping for ${column}:${record[column]} in Ubahn database, skipping update...`)
          delete columnsToUserIdsMap[column]
        } else {
          console.log(`Found mapping for ${column} ${record[column]} to TC handle ${columnsToUserIdsMap[column]}`)
          const matchedTCUserId = await tcUserId.getTcUserIdByHandle(columnsToUserIdsMap[column])
          if (!matchedTCUserId) {
            console.log('\x1b[33m%s\x1b[0m', `Could not get tcUserId neither from mapping file nor from member-api for ${column} ${record[column]} to TC handle ${columnsToUserIdsMap[column]}, skipping...`)
            delete columnsToUserIdsMap[column]
          } else {
            columnsToUserIdsMap[column] = matchedTCUserId
          }
        }
      }

      if (_.isEmpty(columnsToUserIdsMap)) {
        console.log('No columns to update, skipping...')
        continue
      }

      const sql = `UPDATE ${tableName} SET ${_.map(columnsToUserIdsMap, (value, key) => `${key} = '${value}'`).join(',')} WHERE id = '${record.id}';`

      if (MODE === 'test') {
        // dump update to console
        console.log(`DEBUG: ${sql}`)
      } else if (!_.isEmpty(columnsToUserIdsMap)) {
        console.log(`EXECUTE: ${sql}`)
        // update the record via sequelize query
        await models.sequelize.query(
          sql,
          { transaction }
        )
      }
    }

    // commit the transaction
    if (MODE !== 'test') {
      await transaction.commit()
    }
  } catch (err) {
    // rollback the transaction if an error occurs
    await transaction.rollback()

    console.log('An error happened when updating roles with tcUserIds')
    console.log(err)
    process.exit(1)
  }
}

// read cli arguments, pass the table name
const tableName = process.argv[2]
// read cli arguments, pass the column names to update
const columnNames = process.argv[3]

updateTableWithTcUserIds(tableName, columnNames).then(res => {
  console.log('Successfully updated with tcUserIds')
  process.exit(0)
}).catch(err => {
  console.log('An error happened when updating with tcUserIds')
  console.log(err)
  process.exit(1)
})
