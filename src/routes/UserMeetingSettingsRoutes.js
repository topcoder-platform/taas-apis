/**
 * Contains taas routes
 */
const constants = require('../../app-constants')

module.exports = {
  '/taas/user-meeting-settings/callback': {
    get: {
      controller: 'UserMeetingSettingsController',
      method: 'handleConnectCalendarCallback'
    }
  },
  '/taas/user-meeting-settings/:userId/calendars/:calendarId': {
    delete: {
      controller: 'UserMeetingSettingsController',
      method: 'deleteUserCalendar',
      auth: 'jwt',
      scopes: [constants.Scopes.UPDATE_USER_MEETING_SETTINGS, constants.Scopes.ALL_USER_MEETING_SETTINGS]
    }
  },
  '/taas/user-meeting-settings/:userId': {
    get: {
      controller: 'UserMeetingSettingsController',
      method: 'getUserMeetingSettingsByUserId',
      auth: 'jwt',
      scopes: [constants.Scopes.READ_USER_MEETING_SETTINGS, constants.Scopes.ALL_USER_MEETING_SETTINGS]
    }
  }
}
