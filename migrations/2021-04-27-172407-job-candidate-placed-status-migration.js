'use strict';

const config = require('config')

/**
 * Migrate JobCandidate status - from selected to placed.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableName = `${config.DB_SCHEMA_NAME}.job_candidates`
    await queryInterface.sequelize.query(`UPDATE ${tableName} SET status = 'placed' WHERE status = 'selected'`)
  },

  down: async (queryInterface, Sequelize) => {
    const tableName = `${config.DB_SCHEMA_NAME}.job_candidates`
    await queryInterface.sequelize.query(`UPDATE ${tableName} SET status = 'selected' WHERE status = 'placed'`)
  }
};
