/**
 * Contains internal routes
 */
const constants = require('../../app-constants')
module.exports = {
  '/internal/jobs/clean': {
    post: {
      controller: 'CleanUpController',
      method: 'cleanUpTestData',
      auth: 'jwt',
      scopes: [constants.Scopes.ALL_JOB, constants.Scopes.ALL_JOB_CANDIDATE, constants.Scopes.ALL_RESOURCE_BOOKING,
        constants.Scopes.ALL_WORK_PERIOD, constants.Scopes.ALL_WORK_PERIOD_PAYMENT, constants.Scopes.ALL_INTERVIEW]
    }
  }
}
