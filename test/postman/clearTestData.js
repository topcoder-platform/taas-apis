/**
 * Clear the postman test data. All data created by postman e2e tests will be cleared.
 */
const logger = require('../../src/common/logger')
const helper = require('./testHelper')
const config = require('config')

/**
  * Clear the postman test data. The main function of this class.
  * @returns {Promise<void>}
  */
async function clearTestData () {
  logger.info('Clear the Postman test data.')
  await helper.postRequest(`${config.API_BASE_URL}${config.BASE_PATH}/internal/jobs/clean`)
    .then(() => {
      logger.info('Completed!')
      process.exit()
    }).catch((e) => {
      logger.logFullError(e)
      process.exit(1)
    })
}
clearTestData()
