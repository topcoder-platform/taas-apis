const config = require('config')

/*
 * Add viewedByCustomer  field to the JobCandidata model.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn({ tableName: 'job_candidates', schema: config.DB_SCHEMA_NAME }, 'viewed_by_customer',
      {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      })
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn({ tableName: 'job_candidates', schema: config.DB_SCHEMA_NAME }, 'viewed_by_customer')
  }
}
