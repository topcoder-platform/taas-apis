const config = require('config')

/**
 * Add jobTitle field to the RoleSearchRequest model.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn({ tableName: 'role_search_requests', schema: config.DB_SCHEMA_NAME }, 'job_title',
    {
      type: Sequelize.STRING(100),
      allowNull: true
    })
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn({ tableName: 'role_search_requests', schema: config.DB_SCHEMA_NAME}, 'job_title')
  }
}