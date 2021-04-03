const config = require('config')

/*
 * Add isApplicationPageActive field to the Job model.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.addColumn({ tableName: 'jobs', schema: config.DB_SCHEMA_NAME }, 'is_application_page_active',
        { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        { transaction })
      await queryInterface.bulkUpdate({ tableName: 'jobs', schema: config.DB_SCHEMA_NAME },
        { is_application_page_active: false },
        { is_application_page_active: null },
        { transaction })
      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn({ tableName: 'jobs', schema: config.DB_SCHEMA_NAME }, 'is_application_page_active')
  }
}
