/**
 * Contains job routes
 */
const constants = require('../../app-constants')

module.exports = {
  '/jobs': {
    post: {
      controller: 'JobController',
      method: 'createJob',
      auth: 'jwt',
      scopes: [constants.Scopes.CREATE_JOB, constants.Scopes.ALL_JOB]
    },
    get: {
      controller: 'JobController',
      method: 'searchJobs',
      auth: 'jwt',
      scopes: [constants.Scopes.READ_JOB, constants.Scopes.ALL_JOB]
    }
  },
  '/jobs/:id': {
    get: {
      controller: 'JobController',
      method: 'getJob',
      auth: 'jwt',
      scopes: [constants.Scopes.READ_JOB, constants.Scopes.ALL_JOB]
    },
    put: {
      controller: 'JobController',
      method: 'fullyUpdateJob',
      auth: 'jwt',
      scopes: [constants.Scopes.UPDATE_JOB, constants.Scopes.ALL_JOB]
    },
    patch: {
      controller: 'JobController',
      method: 'partiallyUpdateJob',
      auth: 'jwt',
      scopes: [constants.Scopes.UPDATE_JOB, constants.Scopes.ALL_JOB]
    },
    delete: {
      controller: 'JobController',
      method: 'deleteJob',
      auth: 'jwt',
      scopes: [constants.Scopes.DELETE_JOB, constants.Scopes.ALL_JOB]
    }
  }
}
