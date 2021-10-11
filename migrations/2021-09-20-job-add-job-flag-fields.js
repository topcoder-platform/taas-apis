const config = require('config')

/*
 * Add show_in_hot_list, featured, hot_list_excerpt and job_tag to the Job model.
type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.addColumn({ tableName: 'jobs', schema: config.DB_SCHEMA_NAME }, 'show_in_hot_list',
        { type: Sequelize.BOOLEAN, allowNull: true, defaultValue: false },
        { transaction })
      await queryInterface.addColumn({ tableName: 'jobs', schema: config.DB_SCHEMA_NAME }, 'featured',
        { type: Sequelize.BOOLEAN, allowNull: true, defaultValue: false },
        { transaction })
      await queryInterface.addColumn({ tableName: 'jobs', schema: config.DB_SCHEMA_NAME }, 'hot_list_excerpt',
        { type: Sequelize.STRING(255), allowNull: true, defaultValue: '' },
        { transaction })
      await queryInterface.addColumn({ tableName: 'jobs', schema: config.DB_SCHEMA_NAME }, 'job_tag',
        { type: Sequelize.STRING(30), allowNull: true, defaultValue: '' },
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
      await queryInterface.removeColumn({ tableName: 'jobs', schema: config.DB_SCHEMA_NAME }, 'show_in_hot_list', { transaction })
      await queryInterface.removeColumn({ tableName: 'jobs', schema: config.DB_SCHEMA_NAME }, 'featured', { transaction })
      await queryInterface.removeColumn({ tableName: 'jobs', schema: config.DB_SCHEMA_NAME }, 'hot_list_excerpt', { transaction })
      await queryInterface.removeColumn({ tableName: 'jobs', schema: config.DB_SCHEMA_NAME }, 'job_tag', { transaction })
      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  }
}
