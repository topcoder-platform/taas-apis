/**
 * Contains workPeriodPayment routes
 */
const constants = require('../../app-constants')

module.exports = {
  '/workPeriodPayments': {
    post: {
      controller: 'WorkPeriodPaymentController',
      method: 'createWorkPeriodPayment',
      auth: 'jwt',
      scopes: [constants.Scopes.CREATE_WORK_PERIOD_PAYMENT, constants.Scopes.ALL_WORK_PERIOD_PAYMENT]
    },
    get: {
      controller: 'WorkPeriodPaymentController',
      method: 'searchWorkPeriodPayments',
      auth: 'jwt',
      scopes: [constants.Scopes.READ_WORK_PERIOD_PAYMENT, constants.Scopes.ALL_WORK_PERIOD_PAYMENT]
    }
  },
  '/workPeriodPayments/:id': {
    get: {
      controller: 'WorkPeriodPaymentController',
      method: 'getWorkPeriodPayment',
      auth: 'jwt',
      scopes: [constants.Scopes.READ_WORK_PERIOD_PAYMENT, constants.Scopes.ALL_WORK_PERIOD_PAYMENT]
    },
    put: {
      controller: 'WorkPeriodPaymentController',
      method: 'fullyUpdateWorkPeriodPayment',
      auth: 'jwt',
      scopes: [constants.Scopes.UPDATE_WORK_PERIOD_PAYMENT, constants.Scopes.ALL_WORK_PERIOD_PAYMENT]
    },
    patch: {
      controller: 'WorkPeriodPaymentController',
      method: 'partiallyUpdateWorkPeriodPayment',
      auth: 'jwt',
      scopes: [constants.Scopes.UPDATE_WORK_PERIOD_PAYMENT, constants.Scopes.ALL_WORK_PERIOD_PAYMENT]
    }
  }
}
