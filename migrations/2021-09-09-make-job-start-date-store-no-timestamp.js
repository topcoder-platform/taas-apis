const config = require('config')

/*
 * Make Job  start-date store no timestamps
 * start_date: 2021-04-21T16:59:18.089Z -> 2021-04-21
 * description: change type to DATE (DATEONLY) from TIMESTAMPTZ (DATE).
 * By updating the column type, the existing data will be automatically cast to DATE.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.changeColumn({ tableName: 'jobs', schema: config.DB_SCHEMA_NAME }, 'start_date',
        { type: Sequelize.DATEONLY },
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
      await queryInterface.changeColumn({ tableName: 'jobs', schema: config.DB_SCHEMA_NAME }, 'start_date',
        { type: Sequelize.DATE },
        { transaction })
      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  }
}
