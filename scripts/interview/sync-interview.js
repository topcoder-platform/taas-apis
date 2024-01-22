const models = require('../../src/models')
/**
 * Synchronizes the interviews table with the Interview model
 * It propagates any updates to the Interview model source code to the database table
 * including (new columns change, removed columns)
 * @returns {Promise<void>}
 */
const syncInterview = async () => {
  /**
     * Do not set force to true - it will lead to dropping all records
     */

  await models.Interview.sync({ force: false, alter: true })
}

syncInterview().then(res => {
  console.log('interviews table successfully synchronized')
  process.exit(0)
}).catch(err => {
  console.log('An error happened when synchronizing the interviews table')
  console.log(err)
  process.exit(1)
})
