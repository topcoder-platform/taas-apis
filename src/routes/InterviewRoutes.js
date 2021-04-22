/**
 * Contains interview routes
 */
const constants = require('../../app-constants')

module.exports = {
  '/jobCandidates/:jobCandidateId/requestInterview': {
    patch: {
      controller: 'InterviewController',
      method: 'requestInterview',
      auth: 'jwt',
      scopes: [constants.Scopes.CREATE_INTERVIEW, constants.Scopes.ALL_INTERVIEW]
    }
  },
  '/jobCandidates/:jobCandidateId/updateInterview/:round': {
    patch: {
      controller: 'InterviewController',
      method: 'partiallyUpdateInterview',
      auth: 'jwt',
      scopes: [constants.Scopes.UPDATE_INTERVIEW, constants.Scopes.ALL_INTERVIEW]
    }
  },
  '/jobCandidates/:jobCandidateId/interviews': {
    get: {
      controller: 'InterviewController',
      method: 'searchInterviews',
      auth: 'jwt',
      scopes: [constants.Scopes.READ_INTERVIEW, constants.Scopes.ALL_INTERVIEW]
    }
  },
  '/jobCandidates/:jobCandidateId/interviews/:round': {
    get: {
      controller: 'InterviewController',
      method: 'getInterviewByRound',
      auth: 'jwt',
      scopes: [constants.Scopes.READ_INTERVIEW, constants.Scopes.ALL_INTERVIEW]
    }
  }
}
