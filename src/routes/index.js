/**
 * Defines the API routes
 */

const _ = require('lodash')
const JobRoutes = require('./JobRoutes')
const JobCandidateRoutes = require('./JobCandidateRoutes')
const ResourceBookingRoutes = require('./ResourceBookingRoutes')
const HealthCheckRoutes = require('./HealthCheckRoutes')

module.exports = _.extend({},
  JobRoutes,
  JobCandidateRoutes,
  ResourceBookingRoutes,
  HealthCheckRoutes
)
