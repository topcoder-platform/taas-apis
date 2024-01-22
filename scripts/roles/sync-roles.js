const models = require('../../src/models')
/**
 * Synchronizes the roles table with the Role model
 * It propagates any updates to the Role model source code to the database table
 * including (new columns change, removed columns)
 * @returns {Promise<void>}
 */
const syncRoles = async () => {
  /**
     * Do not set force to true - it will lead to dropping all records
     */

  await models.Role.sync({ force: false, alter: true })
}

syncRoles().then(res => {
  console.log('roles table successfully synchronized')
  process.exit(0)
}).catch(err => {
  console.log('An error happened when synchronizing the roles table')
  console.log(err)
  process.exit(1)
})
