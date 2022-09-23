/**
 * Contains healthcheck routes
 */

module.exports = {
  '/taas/health': {
    get: {
      controller: 'HealthCheckController',
      method: 'checkHealth'
    }
  }
}
