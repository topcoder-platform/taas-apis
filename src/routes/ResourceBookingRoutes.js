/**
 * Contains resourceBooking routes
 */

module.exports = {
  '/resourceBookings': {
    post: {
      controller: 'ResourceBookingController',
      method: 'createResourceBooking',
      auth: 'jwt'
    },
    get: {
      controller: 'ResourceBookingController',
      method: 'searchResourceBookings',
      auth: 'jwt'
    }
  },
  '/resourceBookings/:id': {
    get: {
      controller: 'ResourceBookingController',
      method: 'getResourceBooking',
      auth: 'jwt'
    },
    put: {
      controller: 'ResourceBookingController',
      method: 'fullyUpdateResourceBooking',
      auth: 'jwt'
    },
    patch: {
      controller: 'ResourceBookingController',
      method: 'partiallyUpdateResourceBooking',
      auth: 'jwt'
    },
    delete: {
      controller: 'ResourceBookingController',
      method: 'deleteResourceBooking',
      auth: 'jwt'
    }
  }
}
