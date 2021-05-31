/**
 * Contains role routes
 */
const constants = require('../../app-constants')

module.exports = {
  '/roles': {
    post: {
      controller: 'RoleController',
      method: 'createRole',
      auth: 'jwt',
      scopes: [constants.Scopes.CREATE_ROLE, constants.Scopes.ALL_ROLE]
    },
    get: {
      controller: 'RoleController',
      method: 'searchRoles',
      auth: 'jwt',
      scopes: [constants.Scopes.READ_ROLE, constants.Scopes.ALL_ROLE]
    }
  },
  '/roles/:id': {
    get: {
      controller: 'RoleController',
      method: 'getRole',
      auth: 'jwt',
      scopes: [constants.Scopes.READ_ROLE, constants.Scopes.ALL_ROLE]
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
