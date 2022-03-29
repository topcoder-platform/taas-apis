/**
 * Contains User Meetings Settings routes
 *
 * NOTE: we use `/taas-teams` as a prefix, so we don't have to config Topcoder Gateway separately for these routes.
 */
const constants = require('../../app-constants')

module.exports = {
  '/taas-teams/user-meeting-settings/callback': {
    get: {
      controller: 'UserMeetingSettingsController',
      method: 'handleConnectCalendarCallback'
    }
  },
  '/taas-teams/user-meeting-settings/:userId/calendars/:calendarId': {
    delete: {
      controller: 'UserMeetingSettingsController',
      method: 'deleteUserCalendar',
      auth: 'jwt',
      scopes: [constants.Scopes.UPDATE_USER_MEETING_SETTINGS, constants.Scopes.ALL_USER_MEETING_SETTINGS]
    }
  },
  '/taas-teams/user-meeting-settings/:userId': {
    get: {
      controller: 'UserMeetingSettingsController',
      method: 'getUserMeetingSettingsByUserId',
      auth: 'jwt',
      scopes: [constants.Scopes.READ_USER_MEETING_SETTINGS, constants.Scopes.ALL_USER_MEETING_SETTINGS]
    }
  }
}
