'use strict';
const config = require('config')
const { v4: uuid } = require('uuid')
const _ = require('lodash')

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()

    try {
      const userMeetingsSettingsIdsResponse = await queryInterface.sequelize.query(`SELECT id, "nylasCalendars" FROM ${config.DB_SCHEMA_NAME}.user_meeting_settings;`)
      const userMeetingsSettings = userMeetingsSettingsIdsResponse[0]

      // copy `id` to `calendarId`
      // add `id` as UUID
      userMeetingsSettings.forEach(({ nylasCalendars }) => {
        nylasCalendars.forEach((calendar) => {
          calendar.calendarId = calendar.id
          calendar.id = uuid()
        })
      })

      for (let { id, nylasCalendars } of userMeetingsSettings) {
        await queryInterface.sequelize.query(`UPDATE ${config.DB_SCHEMA_NAME}.user_meeting_settings SET "nylasCalendars" = '${JSON.stringify(nylasCalendars)}'::jsonb WHERE id = '${id}'`,
        { transaction })
      }

      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  },
  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()

    try {
      const userMeetingsSettingsIdsResponse = await queryInterface.sequelize.query(`SELECT id, "nylasCalendars" FROM ${config.DB_SCHEMA_NAME}.user_meeting_settings;`)
      const userMeetingsSettings = userMeetingsSettingsIdsResponse[0]

      // copy `calendarId` to `id`
      // delete `calendarId`
      userMeetingsSettings.forEach(({ nylasCalendars }) => {
        nylasCalendars.forEach((calendar) => {
          calendar.id = calendar.calendarId
          delete calendar.calendarId
        })
      })

      for (let { id, nylasCalendars } of userMeetingsSettings) {
        await queryInterface.sequelize.query(`UPDATE ${config.DB_SCHEMA_NAME}.user_meeting_settings SET "nylasCalendars" = '${JSON.stringify(nylasCalendars)}'::jsonb WHERE id = '${id}'`,
        { transaction })
      }

      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  }
};
