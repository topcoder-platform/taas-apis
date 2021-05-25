/**
 * Contains Role routes
 */
const constants = require('../../app-constants')

module.exports = {
  '/roles/new': {
    post: {
      controller: 'RoleController',
      method: 'createRole',
      auth: 'jwt',
      scopes: [constants.Scopes.CREATE_Role, constants.Scopes.ALL_Role]
    }
  },
  '/roles/:id': {
    get: {
      controller: 'RoleController',
      method: 'getRole',
      auth: 'jwt',
      scopes: [constants.Scopes.READ_Role, constants.Scopes.ALL_Role]
    },
    patch: {
      controller: 'RoleController',
      method: 'partiallyUpdateRole',
      auth: 'jwt',
      scopes: [constants.Scopes.UPDATE_Role, constants.Scopes.ALL_Role]
    },
    delete: {
      controller: 'RoleController',
      method: 'deleteRole',
      auth: 'jwt',
      scopes: [constants.Scopes.DELETE_Role, constants.Scopes.ALL_Role]
    }
  },
  '/roles/': {
    get: {
      controller: 'RoleController',
      method: 'searchRoles',
      auth: 'jwt',
      scopes: [constants.Scopes.READ_Role, constants.Scopes.ALL_Role]
    }
  }
}
