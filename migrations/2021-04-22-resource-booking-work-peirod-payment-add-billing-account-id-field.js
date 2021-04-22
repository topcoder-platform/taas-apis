const config = require('config')

/*
 * Add billingAccountId field to the ResourceBooking and WorkPeriodPayment models.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()
    try {
      for (const tableName of ['resource_bookings', 'work_period_payments']) {
        await queryInterface.addColumn({ tableName, schema: config.DB_SCHEMA_NAME }, 'billing_account_id',
          { type: Sequelize.BIGINT },
          { transaction })
      }
      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  },
  down: async (queryInterface, Sequelize) => {
    for (const tableName of ['resource_bookings', 'work_period_payments']) {
      await queryInterface.removeColumn({ tableName, schema: config.DB_SCHEMA_NAME }, 'billing_account_id')
    }
  }
}
