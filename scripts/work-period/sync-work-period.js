const models = require('../../src/models')
/**
 * Synchronizes the work_periods table with the WorkPeriod model
 * It propagates any updates to the WorkPeriod model source code to the database table
 * including (new columns change, removed columns)
 * @returns {Promise<void>}
 */
const syncWorkPeriod = async () => {
  /**
     * Do not set force to true - it will lead to dropping all records
     */

  await models.WorkPeriod.sync({ force: false, alter: true })
}

syncWorkPeriod().then(res => {
  console.log('work_periods table successfully synchronized')
  process.exit(0)
}).catch(err => {
  console.log('An error happened when synchronizing the work_periods table')
  console.log(err)
  process.exit(1)
})
