/**
 * Contains taas routes
 */
const constants = require('../../app-constants')

module.exports = {
  '/taas/user-meeting-settings/:userId': {
    get: {
      controller: 'UserMeetingSettingsController',
      method: 'getUserMeetingSettingsByUserId',
      auth: 'jwt',
      scopes: [constants.Scopes.READ_USER_MEETING_SETTINGS, constants.Scopes.ALL_USER_MEETING_SETTINGS]
    }
  }
}
