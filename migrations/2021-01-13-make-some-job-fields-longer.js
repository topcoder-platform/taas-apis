const config = require('config')

/*
 * Make some Job fields longer
 * title: 64 -> 128
 * description: change type to TEXT (unlimited length)
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.changeColumn({ tableName: 'jobs', schema: config.DB_SCHEMA_NAME }, 'title',
        { type: Sequelize.STRING(128), allowNull: false },
        { transaction })
      await queryInterface.changeColumn({ tableName: 'jobs', schema: config.DB_SCHEMA_NAME }, 'description',
        { type: Sequelize.TEXT },
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
      await queryInterface.changeColumn({ tableName: 'jobs', schema: config.DB_SCHEMA_NAME }, 'title',
        { type: Sequelize.STRING(64), allowNull: false },
        { transaction })
      await queryInterface.changeColumn({ tableName: 'jobs', schema: config.DB_SCHEMA_NAME }, 'description',
        { type: Sequelize.STRING(255) },
        { transaction })
      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  }
}
