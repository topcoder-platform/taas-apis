/**
 * Controller for UserMeetingSettings endpoints
 */
const service = require('../services/UserMeetingSettingsService')
const helper = require('../common/helper')
const { StatusCodes } = require('http-status-codes')

/**
 * Get UserMeetingSettings for the provided userId
 * @param req the request
 * @param res the response
 */
async function getUserMeetingSettingsByUserId (req, res) {
  const result = await service.getUserMeetingSettingsByUserId(req.authUser, req.params.userId, req.query.fromDb)
  helper.setResHeaders(req, res, result)
  res.send(result)
}

/**
 * Handle calendar connection callback for user
 * @param req the request
 * @param res the response
 */
async function handleConnectCalendarCallback (req, res) {
  const redirectUrl = await service.handleConnectCalendarCallback(req.query)
  res.redirect(redirectUrl)
}

/**
 * Delete an existing calendar for user
 * @param req the request
 * @param res the response
 */
async function deleteUserCalendar (req, res) {
  await service.deleteUserCalendar(req.authUser, req.params)
  res.status(StatusCodes.NO_CONTENT).end()
}

module.exports = {
  getUserMeetingSettingsByUserId,
  handleConnectCalendarCallback,
  deleteUserCalendar
}
