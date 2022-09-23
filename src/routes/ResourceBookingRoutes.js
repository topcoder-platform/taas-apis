/**
 * Contains resourceBooking routes
 */
const constants = require('../../app-constants')

module.exports = {
  '/resourceBookings': {
    post: {
      controller: 'ResourceBookingController',
      method: 'createResourceBooking',
      auth: 'jwt',
      scopes: [constants.Scopes.CREATE_RESOURCE_BOOKING, constants.Scopes.ALL_RESOURCE_BOOKING, constants.Scopes.ALL_RESOURCES]
    },
    get: {
      controller: 'ResourceBookingController',
      method: 'searchResourceBookings',
      auth: 'jwt',
      scopes: [constants.Scopes.READ_RESOURCE_BOOKING, constants.Scopes.ALL_RESOURCE_BOOKING, constants.Scopes.ALL_RESOURCES]
    }
  },
  '/resourceBookings/:id': {
    get: {
      controller: 'ResourceBookingController',
      method: 'getResourceBooking',
      auth: 'jwt',
      scopes: [constants.Scopes.READ_RESOURCE_BOOKING, constants.Scopes.ALL_RESOURCE_BOOKING, constants.Scopes.ALL_RESOURCES]
    },
    put: {
      controller: 'ResourceBookingController',
      method: 'fullyUpdateResourceBooking',
      auth: 'jwt',
      scopes: [constants.Scopes.UPDATE_RESOURCE_BOOKING, constants.Scopes.ALL_RESOURCE_BOOKING, constants.Scopes.ALL_RESOURCES]
    },
    patch: {
      controller: 'ResourceBookingController',
      method: 'partiallyUpdateResourceBooking',
      auth: 'jwt',
      scopes: [constants.Scopes.UPDATE_RESOURCE_BOOKING, constants.Scopes.ALL_RESOURCE_BOOKING, constants.Scopes.ALL_RESOURCES]
    },
    delete: {
      controller: 'ResourceBookingController',
      method: 'deleteResourceBooking',
      auth: 'jwt',
      scopes: [constants.Scopes.DELETE_RESOURCE_BOOKING, constants.Scopes.ALL_RESOURCE_BOOKING, constants.Scopes.ALL_RESOURCES]
    }
  }
}
