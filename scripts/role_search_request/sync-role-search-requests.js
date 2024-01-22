const models = require('../../src/models')
/**
 * Synchronizes the role_search_requests table with the RoleSearchRequest model
 * It propagates any updates to the RoleSearchRequest model source code to the database table
 * including (new columns change, removed columns)
 * @returns {Promise<void>}
 */
const syncRoleSearchRequests = async () => {
  /**
     * Do not set force to true - it will lead to dropping all records
     */

  await models.RoleSearchRequest.sync({ force: false, alter: true })
}

syncRoleSearchRequests().then(res => {
  console.log('role_search_requests table successfully synchronized')
  process.exit(0)
}).catch(err => {
  console.log('An error happened when synchronizing the role_search_requests table')
  console.log(err)
  process.exit(1)
})
