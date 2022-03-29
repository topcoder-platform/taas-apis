/**
 * Reindex UserMeetingSettings data in Elasticsearch using data from database
 */
const config = require('config')
const logger = require('../../src/common/logger')
const helper = require('../../src/common/helper')

const userId = helper.getParamFromCliArgs()
const index = config.get('esConfig.ES_INDEX_USER_MEETING_SETTINGS')
const reIndexAllUserMeetingSettingsPrompt = `WARNING: this would remove existent data! Are you sure you want to reindex the index ${index}?`
const reIndexUserMeetingSettingPrompt = `WARNING: this would remove existent data! Are you sure you want to reindex the document with id ${userId} in index ${index}?`

const userMeetingSettingModelOpts = {
  modelName: 'UserMeetingSettings'
}

async function reIndexUserMeetingSettings () {
  if (userId === null) {
    await helper.promptUser(reIndexAllUserMeetingSettingsPrompt, async () => {
      try {
        await helper.indexBulkDataToES(userMeetingSettingModelOpts, index, logger)
        process.exit(0)
      } catch (err) {
        logger.logFullError(err, { component: 'reIndexUserMeetingSettings' })
        process.exit(1)
      }
    })
  } else {
    await helper.promptUser(reIndexUserMeetingSettingPrompt, async () => {
      try {
        await helper.indexDataToEsById(userId, userMeetingSettingModelOpts, index, logger)
        process.exit(0)
      } catch (err) {
        logger.logFullError(err, { component: 'reIndexUserMeetingSettings' })
        process.exit(1)
      }
    })
  }
}

reIndexUserMeetingSettings()
