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
      controller: 'TeamController',
      method: 'searchSkills'
    }
  },
  '/taas-teams/me': {
    get: {
      controller: 'TeamController',
      method: 'getMe',
      auth: 'jwt',
      scopes: [constants.Scopes.READ_TAAS_TEAM]
    }
  },
  '/taas-teams/getSkillsByJobDescription': {
    post: {
      controller: 'TeamController',
      method: 'getSkillsByJobDescription'
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
  },
  '/taas-teams/:id/members': {
    post: {
      controller: 'TeamController',
      method: 'addMembers',
      auth: 'jwt',
      scopes: [constants.Scopes.READ_TAAS_TEAM]
    },
    get: {
      controller: 'TeamController',
      method: 'searchMembers',
      auth: 'jwt',
      scopes: [constants.Scopes.READ_TAAS_TEAM]
    }
  },
  '/taas-teams/:id/invites': {
    get: {
      controller: 'TeamController',
      method: 'searchInvites',
      auth: 'jwt',
      scopes: [constants.Scopes.READ_TAAS_TEAM]
    }
  },
  '/taas-teams/:id/members/:projectMemberId': {
    delete: {
      controller: 'TeamController',
      method: 'deleteMember',
      auth: 'jwt',
      scopes: [constants.Scopes.READ_TAAS_TEAM]
    }
  },
  '/taas-teams/sendRoleSearchRequest': {
    post: {
      controller: 'TeamController',
      method: 'roleSearchRequest'
    }
  },
  '/taas-teams/submitTeamRequest': {
    post: {
      controller: 'TeamController',
      method: 'createTeam',
      auth: 'jwt',
      scopes: [constants.Scopes.CREATE_TAAS_TEAM]
    }
  },
  '/taas-teams/members-suggest/:fragment': {
    get: {
      controller: 'TeamController',
      method: 'suggestMembers',
      auth: 'jwt',
      scopes: []
    }
  }
}
