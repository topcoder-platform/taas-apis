/**
 * Contains taas team routes
 */

module.exports = {
  '/taas-teams': {
    get: {
      controller: 'TeamController',
      method: 'searchTeams',
      auth: 'jwt'
    }
  },
  '/taas-teams/:id': {
    get: {
      controller: 'TeamController',
      method: 'getTeam',
      auth: 'jwt'
    }
  },
  '/taas-teams/:id/jobs/:jobId': {
    get: {
      controller: 'TeamController',
      method: 'getTeamJob',
      auth: 'jwt'
    }
  }
}
