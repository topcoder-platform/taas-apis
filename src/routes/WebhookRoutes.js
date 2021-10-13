/**
 * Contains webhook routes
 */

module.exports = {
  '/nylas-webhook': {
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
