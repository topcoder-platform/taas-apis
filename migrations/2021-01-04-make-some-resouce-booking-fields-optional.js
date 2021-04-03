const config = require('config')

/*
 * Make ResourceBooking fields startDate, endDate, memberRate and customerRate optional.
 */

const targetFields = ['start_date', 'end_date', 'member_rate', 'customer_rate']

module.exports = {
  up: queryInterface => {
    return Promise.all(targetFields.map(field =>
      queryInterface.sequelize.query(`ALTER TABLE bookings.resource_bookings ALTER COLUMN ${field} DROP NOT NULL`)
    ))
  },
  down: queryInterface => {
    return Promise.all(targetFields.map(field =>
      queryInterface.sequelize.query(`ALTER TABLE bookings.resource_bookings ALTER COLUMN ${field} SET NOT NULL`)
    ))
  }
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.changeColumn({ tableName: 'resource_bookings', schema: config.DB_SCHEMA_NAME }, 'start_date',
        { type: Sequelize.DATE, allowNull: true },
        { transaction })
      await queryInterface.changeColumn({ tableName: 'resource_bookings', schema: config.DB_SCHEMA_NAME }, 'end_date',
        { type: Sequelize.DATE, allowNull: true }
        , { transaction })
      await queryInterface.changeColumn({ tableName: 'resource_bookings', schema: config.DB_SCHEMA_NAME }, 'member_rate',
        { type: Sequelize.FLOAT, allowNull: true }
        , { transaction })
      await queryInterface.changeColumn({ tableName: 'resource_bookings', schema: config.DB_SCHEMA_NAME }, 'customer_rate',
        { type: Sequelize.FLOAT, allowNull: true }
        , { transaction })
      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  },
  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.changeColumn({ tableName: 'resource_bookings', schema: config.DB_SCHEMA_NAME }, 'start_date',
        { type: Sequelize.DATE, allowNull: false },
        { transaction })
      await queryInterface.changeColumn({ tableName: 'resource_bookings', schema: config.DB_SCHEMA_NAME }, 'end_date',
        { type: Sequelize.DATE, allowNull: false }
        , { transaction })
      await queryInterface.changeColumn({ tableName: 'resource_bookings', schema: config.DB_SCHEMA_NAME }, 'member_rate',
        { type: Sequelize.FLOAT, allowNull: false }
        , { transaction })
      await queryInterface.changeColumn({ tableName: 'resource_bookings', schema: config.DB_SCHEMA_NAME }, 'customer_rate',
        { type: Sequelize.FLOAT, allowNull: false }
        , { transaction })
      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  }
}
