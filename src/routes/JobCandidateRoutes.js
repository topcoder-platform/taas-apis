/**
 * Contains jobCandidate routes
 */
const constants = require('../../app-constants')

module.exports = {
  '/jobCandidates': {
    post: {
      controller: 'JobCandidateController',
      method: 'createJobCandidate',
      auth: 'jwt',
      scopes: [constants.Scopes.CREATE_JOB_CANDIDATE, constants.Scopes.ALL_JOB_CANDIDATE]
    },
    get: {
      controller: 'JobCandidateController',
      method: 'searchJobCandidates',
      auth: 'jwt',
      scopes: [constants.Scopes.READ_JOB_CANDIDATE, constants.Scopes.ALL_JOB_CANDIDATE]
    }
  },
  '/jobCandidates/:id': {
    get: {
      controller: 'JobCandidateController',
      method: 'getJobCandidate',
      auth: 'jwt',
      scopes: [constants.Scopes.READ_JOB_CANDIDATE, constants.Scopes.ALL_JOB_CANDIDATE]
    },
    put: {
      controller: 'JobCandidateController',
      method: 'fullyUpdateJobCandidate',
      auth: 'jwt',
      scopes: [constants.Scopes.UPDATE_JOB_CANDIDATE, constants.Scopes.ALL_JOB_CANDIDATE]
    },
    patch: {
      controller: 'JobCandidateController',
      method: 'partiallyUpdateJobCandidate',
      auth: 'jwt',
      scopes: [constants.Scopes.UPDATE_JOB_CANDIDATE, constants.Scopes.ALL_JOB_CANDIDATE]
    },
    delete: {
      controller: 'JobCandidateController',
      method: 'deleteJobCandidate',
      auth: 'jwt',
      scopes: [constants.Scopes.DELETE_JOB_CANDIDATE, constants.Scopes.ALL_JOB_CANDIDATE]
    }
  },
  '/jobCandidates/:id/resume': {
    get: {
      controller: 'JobCandidateController',
      method: 'downloadJobCandidateResume',
      auth: 'jwt',
      scopes: [constants.Scopes.READ_JOB_CANDIDATE, constants.Scopes.ALL_JOB_CANDIDATE]
    }
  }
}
