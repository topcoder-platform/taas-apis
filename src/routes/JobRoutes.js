/**
 * Contains job routes
 */

module.exports = {
  '/jobs': {
    post: {
      controller: 'JobController',
      method: 'createJob',
      auth: 'jwt'
    },
    get: {
      controller: 'JobController',
      method: 'searchJobs',
      auth: 'jwt'
    }
  },
  '/jobs/:id': {
    get: {
      controller: 'JobController',
      method: 'getJob',
      auth: 'jwt'
    },
    put: {
      controller: 'JobController',
      method: 'fullyUpdateJob',
      auth: 'jwt'
    },
    patch: {
      controller: 'JobController',
      method: 'partiallyUpdateJob',
      auth: 'jwt'
    },
    delete: {
      controller: 'JobController',
      method: 'deleteJob',
      auth: 'jwt'
    }
  }
}
