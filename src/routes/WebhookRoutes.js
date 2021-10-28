/**
 * Contains webhook routes
 *
 * NOTE: we use `/taas-teams` as a prefix, so we don't have to config Topcoder Gateway separately for these routes.
 */
module.exports = {
  // IMPORTANT, don't forget to update this route in `app.js` if you change it
  // as we are using a special middleware for this route
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
