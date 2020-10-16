/**
 * Contains jobCandidate routes
 */

module.exports = {
  '/jobCandidates': {
    post: {
      controller: 'JobCandidateController',
      method: 'createJobCandidate',
      auth: 'jwt'
    },
    get: {
      controller: 'JobCandidateController',
      method: 'searchJobCandidates',
      auth: 'jwt'
    }
  },
  '/jobCandidates/:id': {
    get: {
      controller: 'JobCandidateController',
      method: 'getJobCandidate',
      auth: 'jwt'
    },
    put: {
      controller: 'JobCandidateController',
      method: 'fullyUpdateJobCandidate',
      auth: 'jwt'
    },
    patch: {
      controller: 'JobCandidateController',
      method: 'partiallyUpdateJobCandidate',
      auth: 'jwt'
    },
    delete: {
      controller: 'JobCandidateController',
      method: 'deleteJobCandidate',
      auth: 'jwt'
    }
  }
}
