/**
 * Controller for cleaning up test data
 */

const service = require('../services/CleanUpService')

/**
  * Clear the postman test data
  * @param {Object} req the request
  * @param {Object} res the response
  */
async function cleanUpTestData (req, res) {
  await service.cleanUpTestData(req.authUser)
  res.status(200).end()
}

module.exports = {
  cleanUpTestData
}
