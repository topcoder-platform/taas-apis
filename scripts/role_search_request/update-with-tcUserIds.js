const models = require('../../src/models')
const tcUserId = require('../common/tcUserId')
const _ = require('lodash')
const Sequelize = require('sequelize')

const updateRolesWithTcUserIds = async () => {
  const dbUrl = process.env.UBAHN_DB_URL
  const MODE = process.env.MODE || 'test'

  if (_.isUndefined(dbUrl)) {
    console.log('UBAHN_DB_URL environment variable is required to be set. Exiting!!')
    process.exit(1)
  }

  // Get the mapping between the Ubahn user UUID and user handle
  const ubahnDbConnection = await tcUserId.getUbahnDatabaseConnection(dbUrl)

  const recordsToProcess = await models.RoleSearchRequest.findAll({
    attributes: ['id', 'memberId', 'createdBy', 'updatedBy'],
    where: {
      memberId: {
        [Sequelize.Op.ne]: '00000000-0000-0000-0000-000000000000'
      },
      createdBy: {
        [Sequelize.Op.ne]: '00000000-0000-0000-0000-000000000000'
      }
    },
    distinct: true
  })

  console.log(`Found ${recordsToProcess.length} records to process`)

  // get list of unique user ids from memberId, created by and updated by fields
  const userIds = _.uniq(_.concat(_.map(recordsToProcess, 'memberId'), _.map(recordsToProcess, 'createdBy'), _.map(recordsToProcess, 'updatedBy')))

  // get mapping between uuid and handle
  const uuidToHandleMap = await tcUserId.getUserUbahnUUIDToHandleMap(ubahnDbConnection, userIds)
  // close ubahn db connection
  await ubahnDbConnection.close()

  // create a transaction
  const transaction = await models.sequelize.transaction()

  try {
    // update roles with tc user ids
    for (const record of recordsToProcess) {
      const memberIdHandle = uuidToHandleMap[record.memberId]
      const createdByHandle = uuidToHandleMap[record.createdBy]
      const updatedByHandle = uuidToHandleMap[record.updatedBy]

      const createdByTcUserId = await tcUserId.getTcUserIdByHandle(createdByHandle)
      const memberIdTcUserId = await tcUserId.getTcUserIdByHandle(memberIdHandle)
      let updatedByTcUserId = null

      if (updatedByHandle) {
        updatedByTcUserId = await tcUserId.getTcUserIdByHandle(updatedByHandle)
      }

      if (MODE === 'test') {
        // dump update to console
        console.log(`Updating role_search_request with id ${record.id} with memberId ${memberIdTcUserId} createdBy ${createdByTcUserId} and updatedBy ${updatedByTcUserId}`)
      } else {
        await record.update({
          memberId: memberIdTcUserId,
          createdBy: createdByTcUserId,
          updatedBy: updatedByTcUserId
        }, { transaction })
      }
    }

    // commit the transaction
    if (MODE !== 'test') {
      await transaction.commit()
    }

    console.log('Successfully updated role_search_request with tcUserIds')
    process.exit(0)
  } catch (err) {
    // rollback the transaction if an error occurs
    await transaction.rollback()

    console.log('An error happened when updating role_search_request with tcUserIds')
    console.log(err)
    process.exit(1)
  }
}

updateRolesWithTcUserIds().then(res => {
  console.log('Successfully updated role_search_request with tcUserIds')
  process.exit(0)
}).catch(err => {
  console.log('An error happened when updating role_search_request with tcUserIds')
  console.log(err)
  process.exit(1)
})
