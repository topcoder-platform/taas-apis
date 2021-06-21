/**
 * Contains role routes
 */
const constants = require('../../app-constants')

module.exports = {
  '/taas-roles': {
    post: {
      controller: 'RoleController',
      method: 'createRole',
      auth: 'jwt',
      scopes: [constants.Scopes.CREATE_ROLE, constants.Scopes.ALL_ROLE]
    },
    get: {
      controller: 'RoleController',
      method: 'searchRoles',
    }
  },
  '/taas-roles/:id': {
    get: {
      controller: 'RoleController',
      method: 'getRole',
    },
    patch: {
      controller: 'RoleController',
      method: 'updateRole',
      auth: 'jwt',
      scopes: [constants.Scopes.UPDATE_ROLE, constants.Scopes.ALL_ROLE]
    },
    delete: {
      controller: 'RoleController',
      method: 'deleteRole',
      auth: 'jwt',
      scopes: [constants.Scopes.DELETE_ROLE, constants.Scopes.ALL_ROLE]
    }
  }
}
