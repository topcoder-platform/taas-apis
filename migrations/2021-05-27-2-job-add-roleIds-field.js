const config = require('config')

/*
 * Add roleIds field to the Job model.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn({ tableName: 'jobs', schema: config.DB_SCHEMA_NAME }, 'role_ids',
      {
        type: Sequelize.ARRAY({
          type: Sequelize.UUID
        })
      })
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn({ tableName: 'jobs', schema: config.DB_SCHEMA_NAME }, 'role_ids')
  }
}
