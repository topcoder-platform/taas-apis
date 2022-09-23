/**
 * Contains healthcheck routes
 */

module.exports = {
  '/health': {
    get: {
      controller: 'HealthCheckController',
      method: 'checkHealth'
    }
  }
}
