const config = require('config')

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn({ tableName: 'role_search_requests', schema: config.DB_SCHEMA_NAME}, 'job_description', {type: Sequelize.STRING(2000)})
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn({ tableName: 'role_search_requests', schema: config.DB_SCHEMA_NAME}, 'job_description', {type: Sequelize.STRING(255)})
  },
}