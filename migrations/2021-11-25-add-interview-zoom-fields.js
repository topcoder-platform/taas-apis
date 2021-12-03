'use strict';
const config = require('config')

/*
 * Add zoomAccountApiKey, zoomMeetingId to the Interview model.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const interviewsTable = { tableName: 'interviews', schema: config.DB_SCHEMA_NAME }
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.addColumn(interviewsTable, 'zoom_account_api_key', { type: Sequelize.STRING(255), allowNull: true }, { transaction })
      await queryInterface.addColumn(interviewsTable, 'zoom_meeting_id', { type: Sequelize.BIGINT, allowNull: true }, { transaction })
      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  },
  down: async (queryInterface, Sequelize) => {
    const interviewsTable = { tableName: 'interviews', schema: config.DB_SCHEMA_NAME }
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.removeColumn(interviewsTable, 'zoom_account_api_key', { transaction })
      await queryInterface.removeColumn(interviewsTable, 'zoom_meeting_id', { transaction })
      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  }
};
