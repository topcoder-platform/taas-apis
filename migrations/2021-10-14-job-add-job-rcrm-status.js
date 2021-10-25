const config = require('config')

/*
 * Add rcrm_status, rcrm_reason to the Job model.
type: Sequelize.STRING(255),
        defaultValue: null,
        allowNull: true
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.addColumn({ tableName: 'jobs', schema: config.DB_SCHEMA_NAME }, 'rcrm_status',
        { type: Sequelize.STRING(255), allowNull: true, defaultValue: null },
        { transaction })
      await queryInterface.addColumn({ tableName: 'jobs', schema: config.DB_SCHEMA_NAME }, 'rcrm_reason',
        { type: Sequelize.STRING(255), allowNull: true, defaultValue: null },
        { transaction })
      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  },
  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.removeColumn({ tableName: 'jobs', schema: config.DB_SCHEMA_NAME }, 'rcrm_status', { transaction })
      await queryInterface.removeColumn({ tableName: 'jobs', schema: config.DB_SCHEMA_NAME }, 'rcrm_reason', { transaction })
      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  }
}
