const config = require('config')

/*
 * Add start_timestamp and attendees_list fields to the Job model.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.addColumn({ tableName: 'interviews', schema: config.DB_SCHEMA_NAME }, 'start_timestamp',
        { type: Sequelize.DATE },
        { transaction })
       await queryInterface.addColumn({ tableName: 'interviews', schema: config.DB_SCHEMA_NAME }, 'attendees_list',
        { type: Sequelize.ARRAY(Sequelize.STRING) },
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
      await queryInterface.removeColumn({ tableName: 'interviews', schema: config.DB_SCHEMA_NAME }, 'start_timestamp',
        { transaction })
      await queryInterface.removeColumn({ tableName: 'interviews', schema: config.DB_SCHEMA_NAME }, 'attendees_list',
        { transaction })
      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  }
}
