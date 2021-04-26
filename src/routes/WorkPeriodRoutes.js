/**
 * Contains workPeriod routes
 */
const constants = require('../../app-constants')

module.exports = {
  '/work-periods': {
    post: {
      controller: 'WorkPeriodController',
      method: 'createWorkPeriod',
      auth: 'jwt',
      scopes: [constants.Scopes.CREATE_WORK_PERIOD, constants.Scopes.ALL_WORK_PERIOD]
    },
    get: {
      controller: 'WorkPeriodController',
      method: 'searchWorkPeriods',
      auth: 'jwt',
      scopes: [constants.Scopes.READ_WORK_PERIOD, constants.Scopes.ALL_WORK_PERIOD]
    }
  },
  '/work-periods/:id': {
    get: {
      controller: 'WorkPeriodController',
      method: 'getWorkPeriod',
      auth: 'jwt',
      scopes: [constants.Scopes.READ_WORK_PERIOD, constants.Scopes.ALL_WORK_PERIOD]
    },
    put: {
      controller: 'WorkPeriodController',
      method: 'fullyUpdateWorkPeriod',
      auth: 'jwt',
      scopes: [constants.Scopes.UPDATE_WORK_PERIOD, constants.Scopes.ALL_WORK_PERIOD]
    },
    patch: {
      controller: 'WorkPeriodController',
      method: 'partiallyUpdateWorkPeriod',
      auth: 'jwt',
      scopes: [constants.Scopes.UPDATE_WORK_PERIOD, constants.Scopes.ALL_WORK_PERIOD]
    },
    delete: {
      controller: 'WorkPeriodController',
      method: 'deleteWorkPeriod',
      auth: 'jwt',
      scopes: [constants.Scopes.DELETE_WORK_PERIOD, constants.Scopes.ALL_WORK_PERIOD]
    }
  }
}
