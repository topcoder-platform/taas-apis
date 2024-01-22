const models = require('../../src/models')
/**
 * Synchronizes the work_period_payments table with the WorkPeriodPayment model
 * It propagates any updates to the WorkPeriodPayment model source code to the database table
 * including (new columns change, removed columns)
 * @returns {Promise<void>}
 */
const syncWorkPeriodPayment = async () => {
  /**
     * Do not set force to true - it will lead to dropping all records
     */

  await models.WorkPeriodPayment.sync({ force: false, alter: true })
}

syncWorkPeriodPayment().then(res => {
  console.log('work_period_payments table successfully synchronized')
  process.exit(0)
}).catch(err => {
  console.log('An error happened when synchronizing the work_period_payments table')
  console.log(err)
  process.exit(1)
})
