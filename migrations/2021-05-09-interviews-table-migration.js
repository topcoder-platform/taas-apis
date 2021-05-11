'use strict';
const config = require('config')

/**
 * Add `xaiId` column.
 * Add `rescheduleUrl` column.
 * Add `endTimestamp` column.
 * Add `duration` column.
 * Add `templateId` column.
 * Add `templateType` column.
 * Add `title` column.
 * Add `locationDetails` column.
 * Add `hostName` column.
 * Add `hostEmail` column.
 * Add `guestNames` column.
 * Rename column `attendeesList` to `guestEmails`
 * Rename column `googleCalendarId` to `calendarEventId`
 * Rename column `xaiTemplate` to `templateUrl`
 * Remove `customMessage` column
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = { tableName: 'interviews', schema: config.DB_SCHEMA_NAME }
    await Promise.all([
      queryInterface.addColumn(table, 'xai_id', { type: Sequelize.UUID }),
      queryInterface.addColumn(table, 'duration', { type: Sequelize.INTEGER }),
      queryInterface.addColumn(table, 'end_timestamp', { type: Sequelize.DATE }),
      queryInterface.addColumn(table, 'template_id', { type: Sequelize.UUID }),
      queryInterface.addColumn(table, 'template_type', { type: Sequelize.STRING(255) }),
      queryInterface.addColumn(table, 'location_details', { type: Sequelize.STRING(255) }),
      queryInterface.addColumn(table, 'title', { type: Sequelize.STRING(255) }),
      queryInterface.addColumn(table, 'host_name', { type: Sequelize.STRING(255) }),
      queryInterface.addColumn(table, 'host_email', { type: Sequelize.STRING(255) }),
      queryInterface.addColumn(table, 'guest_names', { type: Sequelize.ARRAY(Sequelize.STRING) }),
      queryInterface.addColumn(table, 'reschedule_url', { type: Sequelize.STRING(255) }),
      queryInterface.renameColumn(table, 'attendees_list', 'guest_emails'),
      queryInterface.renameColumn(table, 'google_calendar_id', 'calendar_event_id'),
      queryInterface.renameColumn(table, 'xai_template', 'template_url'),
      queryInterface.removeColumn(table, 'custom_message')
    ])
  },

  down: async (queryInterface, Sequelize) => {
    const table = { tableName: 'interviews', schema: config.DB_SCHEMA_NAME }
    await Promise.all([
      queryInterface.removeColumn(table, 'xai_id'),
      queryInterface.removeColumn(table, 'duration'),
      queryInterface.removeColumn(table, 'end_timestamp'),
      queryInterface.removeColumn(table, 'template_id'),
      queryInterface.removeColumn(table, 'template_type'),
      queryInterface.removeColumn(table, 'location_details'),
      queryInterface.removeColumn(table, 'title'),
      queryInterface.removeColumn(table, 'host_name'),
      queryInterface.removeColumn(table, 'host_email'),
      queryInterface.removeColumn(table, 'guest_names'),
      queryInterface.removeColumn(table, 'reschedule_url'),
      queryInterface.renameColumn(table, 'guest_emails', 'attendees_list'),
      queryInterface.renameColumn(table, 'calendar_event_id', 'google_calendar_id'),
      queryInterface.renameColumn(table, 'template_url', 'xai_template'),
      queryInterface.addColumn(table, 'custom_message', { type: Sequelize.TEXT })
    ])
  }
};
