const config = require('config')

/*
 * Replace endData with duration in Job model.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.addColumn({ tableName: 'jobs', schema: config.DB_SCHEMA_NAME }, 'duration',
        { type: Sequelize.INTEGER },
        { transaction })
      await queryInterface.sequelize.query(`UPDATE ${config.DB_SCHEMA_NAME}.jobs SET duration = DATE_PART('day', end_date - start_date)`,
        { transaction })
      await queryInterface.removeColumn({ tableName: 'jobs', schema: config.DB_SCHEMA_NAME }, 'end_date',
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
      await queryInterface.addColumn({ tableName: 'jobs', schema: config.DB_SCHEMA_NAME }, 'end_date',
        { type: Sequelize.DATE },
        { transaction })
      await queryInterface.sequelize.query(`UPDATE ${config.DB_SCHEMA_NAME}.jobs SET end_date = start_date + COALESCE(duration,0) * INTERVAL '1 day'`,
        { transaction })
      await queryInterface.removeColumn({ tableName: 'jobs', schema: config.DB_SCHEMA_NAME }, 'duration',
        { transaction })
      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  }
}
