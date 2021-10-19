/**
 * Controller for webhook endpoints
 */
const nylasWebhookService = require('../services/NylasWebhookService')

async function nylasWebhook (req, res) {
  await nylasWebhookService.nylasWebhook(req, res)
}

async function nylasWebhookCheck (req, res) {
  const result = await nylasWebhookService.nylasWebhookCheck(req, res)
  res.send(result)
}

module.exports = {
  nylasWebhook,
  nylasWebhookCheck
}
