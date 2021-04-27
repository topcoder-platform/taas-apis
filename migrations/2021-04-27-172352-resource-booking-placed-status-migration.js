'use strict';

const config = require('config')

/**
 * Migrate ResourceBooking status - from assigned to placed.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableName = `${config.DB_SCHEMA_NAME}.resource_bookings`
    await queryInterface.sequelize.query(`UPDATE ${tableName} SET status = 'placed' WHERE status = 'assigned'`)
  },

  down: async (queryInterface, Sequelize) => {
    const tableName = `${config.DB_SCHEMA_NAME}.resource_bookings`
    await queryInterface.sequelize.query(`UPDATE ${tableName} SET status = 'assigned' WHERE status = 'placed'`)
  }
};
