'use strict';

const config = require('config')

/**
 * Migrate JobCandidate status - from rejected to rejected - other.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableName = `${config.DB_SCHEMA_NAME}.job_candidates`
    await queryInterface.sequelize.query(
      `UPDATE ${tableName} SET status = 'rejected - other' WHERE status = 'rejected'`
    )
  },

  down: async (queryInterface, Sequelize) => {
    const tableName = `${config.DB_SCHEMA_NAME}.job_candidates`
    await queryInterface.sequelize.query(
      `UPDATE ${tableName} SET status = 'rejected' WHERE status = 'rejected - other'`
    )
  }
};
