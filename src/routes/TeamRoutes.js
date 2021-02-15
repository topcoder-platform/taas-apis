/**
 * Contains taas team routes
 */
const constants = require('../../app-constants')

module.exports = {
  '/taas-teams': {
    get: {
      controller: 'TeamController',
      method: 'searchTeams',
      auth: 'jwt',
      scopes: [constants.Scopes.READ_TAAS_TEAM]
    }
  },
  '/taas-teams/email': {
    post: {
      controller: 'TeamController',
      method: 'sendEmail',
      auth: 'jwt',
      scopes: [constants.Scopes.READ_TAAS_TEAM]
    }
  },
  '/taas-teams/skills': {
    get: {
      controller: 'SkillController',
      method: 'searchSkills',
      auth: 'jwt',
      scopes: [constants.Scopes.READ_TAAS_TEAM]
    }
  },
  '/taas-teams/:id': {
    get: {
      controller: 'TeamController',
      method: 'getTeam',
      auth: 'jwt',
      scopes: [constants.Scopes.READ_TAAS_TEAM]
    }
  },
  '/taas-teams/:id/jobs/:jobId': {
    get: {
      controller: 'TeamController',
      method: 'getTeamJob',
      auth: 'jwt',
      scopes: [constants.Scopes.READ_TAAS_TEAM]
    }
  }
}
