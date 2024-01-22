const models = require('../../src/models')
/**
 * Synchronizes the user_meeting_settings table with the UserMeetingSettings model
 * It propagates any updates to the UserMeetingSettings model source code to the database table
 * including (new columns change, removed columns)
 * @returns {Promise<void>}
 */
const syncUserMeetingSettings = async () => {
  /**
     * Do not set force to true - it will lead to dropping all records
     */

  await models.UserMeetingSettings.sync({ force: false, alter: true })
}

syncUserMeetingSettings().then(res => {
  console.log('user_meeting_settings table successfully synchronized')
  process.exit(0)
}).catch(err => {
  console.log('An error happened when synchronizing the user_meeting_settings table')
  console.log(err)
  process.exit(1)
})
