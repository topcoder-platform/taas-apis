'use strict';
const config = require('config')

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const interviewsTable = { tableName: 'interviews', schema: config.DB_SCHEMA_NAME }
    const transaction = await queryInterface.sequelize.transaction()

    try {
      // renamed column timezone to host_timezone & added new column & guest_timezone
      // also populated the guest_timezone column with host_timezone column values
      await queryInterface.renameColumn(interviewsTable, 'timezone', 'host_timezone', { transaction })
      await queryInterface.addColumn(interviewsTable, 'guest_timezone', { type: Sequelize.STRING(255) }, { transaction })

      await queryInterface.sequelize.query(`UPDATE ${config.DB_SCHEMA_NAME}.interviews SET guest_timezone = host_timezone`,
        { transaction })

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
      await queryInterface.rename(interviewsTable, 'host_timezone', 'timezone', { transaction })
      await queryInterface.removeColumn(interviewsTable, 'guest_timezone', { transaction })

      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  }
};
