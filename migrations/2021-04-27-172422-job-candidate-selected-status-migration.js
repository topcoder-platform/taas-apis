'use strict';

const config = require('config')

/**
 * Migrate JobCandidate status - from shortlist to selected.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableName = `${config.DB_SCHEMA_NAME}.job_candidates`
    await queryInterface.sequelize.query(`UPDATE ${tableName} SET status = 'interview' WHERE status = 'shortlist'`)
  },

  down: async (queryInterface, Sequelize) => {
    const tableName = `${config.DB_SCHEMA_NAME}.job_candidates`
    await queryInterface.sequelize.query(`UPDATE ${tableName} SET status = 'shortlist' WHERE status = 'interview'`)
  }
};
