/**
 * Contains webhook routes
 *
 * NOTE: we use `/taas-teams` as a prefix, so we don't have to config Topcoder Gateway separately for these routes.
 */
module.exports = {
  '/taas-teams/nylas-webhooks': {
    post: {
      controller: 'WebhookController',
      method: 'nylasWebhook'
    },
    get: {
      controller: 'WebhookController',
      method: 'nylasWebhookCheck'
    }
  }
}
