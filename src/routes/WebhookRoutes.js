/**
 * Contains webhook routes
 */

module.exports = {
  '/taas/nylas-webhooks': {
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
