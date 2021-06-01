/**
 * Contains taas team routes
 */
const constants = require('../../app-constants');

module.exports = {
  '/taas-teams': {
    get: {
      controller: 'TeamController',
      method: 'searchTeams',
      auth: 'jwt',
      scopes: [constants.Scopes.READ_TAAS_TEAM],
    },
  },
  '/taas-teams/email': {
    post: {
      controller: 'TeamController',
      method: 'sendEmail',
      auth: 'jwt',
      scopes: [constants.Scopes.READ_TAAS_TEAM],
    },
  },
  '/taas-teams/skills': {
    get: {
      controller: 'SkillController',
      method: 'searchSkills',
      auth: 'jwt',
      scopes: [constants.Scopes.READ_TAAS_TEAM],
    },
  },
  '/taas-teams/me': {
    get: {
      controller: 'TeamController',
      method: 'getMe',
      auth: 'jwt',
      scopes: [constants.Scopes.READ_TAAS_TEAM],
    },
  },
  '/taas-teams/getSkillsByJobDescription': {
    post: {
      controller: 'TeamController',
      method: 'getSkillsByJobDescription',
      auth: 'jwt',
      scopes: [constants.Scopes.READ_TAAS_TEAM],
    },
  },
  '/taas-teams/:id': {
    get: {
      controller: 'TeamController',
      method: 'getTeam',
      auth: 'jwt',
      scopes: [constants.Scopes.READ_TAAS_TEAM],
    },
  },
  '/taas-teams/:id/jobs/:jobId': {
    get: {
      controller: 'TeamController',
      method: 'getTeamJob',
      auth: 'jwt',
      scopes: [constants.Scopes.READ_TAAS_TEAM],
    },
  },
  '/taas-teams/:id/members': {
    post: {
      controller: 'TeamController',
      method: 'addMembers',
      auth: 'jwt',
      scopes: [constants.Scopes.READ_TAAS_TEAM],
    },
    get: {
      controller: 'TeamController',
      method: 'searchMembers',
      auth: 'jwt',
      scopes: [constants.Scopes.READ_TAAS_TEAM],
    },
  },
  '/taas-teams/:id/invites': {
    get: {
      controller: 'TeamController',
      method: 'searchInvites',
      auth: 'jwt',
      scopes: [constants.Scopes.READ_TAAS_TEAM],
    },
  },
  '/taas-teams/:id/members/:projectMemberId': {
    delete: {
      controller: 'TeamController',
      method: 'deleteMember',
      auth: 'jwt',
      scopes: [constants.Scopes.READ_TAAS_TEAM],
    },
  },
  '/taas-teams/createTeamRequest': {
    post: {
      controller: 'TeamController',
      method: 'createProj',
      auth: 'jwt',
      scopes: [constants.Scopes.READ_TAAS_TEAM],
    },
  },
};
