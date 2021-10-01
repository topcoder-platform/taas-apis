/**
 * Controller for UserMeetingSettings endpoints
 */
const service = require('../services/UserMeetingSettingsService')
const helper = require('../common/helper')

/**
 * Get UserMeetingSettings for the provided userId
 * @param req the request
 * @param res the response
 */
async function getUserMeetingSettingsByUserId (req, res) {
  const result = await service.getUserMeetingSettingsByUserId(req.authUser, req.params.userId, req.query.fromDb)
  helper.setResHeaders(req, res, result)
  res.send(result.result)
}

module.exports = { getUserMeetingSettingsByUserId }
