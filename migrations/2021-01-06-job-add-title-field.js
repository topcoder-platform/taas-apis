const config = require('config')

/*
 * Add title field to the Job model.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.addColumn({ tableName: 'jobs', schema: config.DB_SCHEMA_NAME }, 'title',
        { type: Sequelize.STRING(64) },
        { transaction })
      await queryInterface.sequelize.query(`UPDATE ${config.DB_SCHEMA_NAME}.jobs SET title = description`,
        { transaction })
      await queryInterface.changeColumn({ tableName: 'jobs', schema: config.DB_SCHEMA_NAME }, 'title',
        { type: Sequelize.STRING(64), allowNull: false }
        , { transaction })
      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn({ tableName: 'jobs', schema: config.DB_SCHEMA_NAME }, 'title')
  }
}
