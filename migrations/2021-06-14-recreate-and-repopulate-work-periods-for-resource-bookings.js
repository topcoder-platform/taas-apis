const config = require('config')
const ResourceBooking = require('../src/models').ResourceBooking
const _ = require('lodash')
const helper = require('../src/common/helper')
const { v4: uuid } = require('uuid')
const { PaymentStatus } = require('../app-constants')

// maximum start date of resource bookings when populating work periods from existing resource bookings in migration script
const MAX_START_DATE = process.env.MAX_START_DATE || '2100-12-31'
// maximum end date of resource bookings when populating work periods from existing resource bookings in migration script
const MAX_END_DATE = process.env.MAX_END_DATE || '2100-12-31'

/*
 * Populate WorkPeriods for ResourceBookings
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()
    const Op = Sequelize.Op
    try {
      await queryInterface.bulkDelete({
        tableName: 'payment_schedulers',
        schema: config.DB_SCHEMA_NAME,
        transaction
      })
      await queryInterface.bulkDelete({
        tableName: 'work_period_payments',
        schema: config.DB_SCHEMA_NAME,
        transaction
      })
      await queryInterface.bulkDelete({
        tableName: 'work_periods',
        schema: config.DB_SCHEMA_NAME,
        transaction
      })
      await queryInterface.removeColumn({ tableName: 'work_periods', schema: config.DB_SCHEMA_NAME }, 'member_rate', { transaction })
      await queryInterface.removeColumn({ tableName: 'work_periods', schema: config.DB_SCHEMA_NAME }, 'customer_rate', { transaction })
      await queryInterface.addColumn({ tableName: 'work_periods', schema: config.DB_SCHEMA_NAME }, 'days_paid',
        { type: Sequelize.INTEGER, allowNull: false },
        { transaction })
      await queryInterface.addColumn({ tableName: 'work_periods', schema: config.DB_SCHEMA_NAME }, 'payment_total',
        { type: Sequelize.FLOAT, allowNull: false },
        { transaction })
      await queryInterface.changeColumn({ tableName: 'work_periods', schema: config.DB_SCHEMA_NAME }, 'days_worked',
        { type: Sequelize.INTEGER, allowNull: false },
        { transaction })
      await queryInterface.addColumn({ tableName: 'work_period_payments', schema: config.DB_SCHEMA_NAME }, 'member_rate',
        { type: Sequelize.FLOAT, allowNull: false },
        { transaction })
      await queryInterface.addColumn({ tableName: 'work_period_payments', schema: config.DB_SCHEMA_NAME }, 'customer_rate',
        { type: Sequelize.FLOAT, allowNull: true },
        { transaction })
      await queryInterface.addColumn({ tableName: 'work_period_payments', schema: config.DB_SCHEMA_NAME }, 'days',
        { type: Sequelize.INTEGER, allowNull: false },
        { transaction })
      await queryInterface.changeColumn({ tableName: 'work_period_payments', schema: config.DB_SCHEMA_NAME }, 'amount',
        { type: Sequelize.DOUBLE, allowNull: false },
        { transaction })
      await queryInterface.changeColumn({ tableName: 'work_period_payments', schema: config.DB_SCHEMA_NAME }, 'billing_account_id',
        { type: Sequelize.BIGINT, allowNull: false },
        { transaction })
      const resourceBookings = await ResourceBooking.findAll({
        where: {
          start_date: { [Op.lt]: new Date(MAX_START_DATE) },
          end_date: { [Op.lt]: new Date(MAX_END_DATE) }
        }
      })
      if (resourceBookings.length === 0) {
        return
      }
      const workPeriodData = []
      for (const rb of resourceBookings) {
        if (!_.isNil(rb.startDate) && !_.isNil(rb.endDate)) {
          const periods = helper.extractWorkPeriods(rb.startDate, rb.endDate)
          const user = await helper.ensureUserById(rb.userId)
          _.forEach(periods, period => {
            workPeriodData.push({
              id: uuid(),
              resource_booking_id: rb.id,
              project_id: rb.projectId,
              user_handle: user.handle,
              start_date: period.startDate,
              end_date: period.endDate,
              days_worked: period.daysWorked,
              days_paid: 0,
              payment_total: 0,
              payment_status: period.daysWorked === 0 ? PaymentStatus.NO_DAYS : PaymentStatus.PENDING,
              created_by: config.m2m.M2M_AUDIT_USER_ID,
              created_at: new Date()
            })
          })
        }
      }
      await queryInterface.bulkInsert({ tableName: 'work_periods', schema: config.DB_SCHEMA_NAME }, workPeriodData, { transaction })
      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  },
  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.bulkDelete({
        tableName: 'payment_schedulers',
        schema: config.DB_SCHEMA_NAME,
        transaction
      })
      await queryInterface.bulkDelete({
        tableName: 'work_period_payments',
        schema: config.DB_SCHEMA_NAME,
        transaction
      })
      await queryInterface.bulkDelete({
        tableName: 'work_periods',
        schema: config.DB_SCHEMA_NAME,
        transaction
      })
      await queryInterface.removeColumn({ tableName: 'work_periods', schema: config.DB_SCHEMA_NAME }, 'days_paid', { transaction })
      await queryInterface.removeColumn({ tableName: 'work_periods', schema: config.DB_SCHEMA_NAME }, 'payment_total', { transaction })
      await queryInterface.addColumn({ tableName: 'work_periods', schema: config.DB_SCHEMA_NAME }, 'member_rate',
        { type: Sequelize.FLOAT, allowNull: true },
        { transaction })
      await queryInterface.addColumn({ tableName: 'work_periods', schema: config.DB_SCHEMA_NAME }, 'customer_rate',
        { type: Sequelize.FLOAT, allowNull: true },
        { transaction })
      await queryInterface.changeColumn({ tableName: 'work_periods', schema: config.DB_SCHEMA_NAME }, 'days_worked',
        { type: Sequelize.INTEGER, allowNull: true },
        { transaction })
      await queryInterface.removeColumn({ tableName: 'work_period_payments', schema: config.DB_SCHEMA_NAME }, 'member_rate', { transaction })
      await queryInterface.removeColumn({ tableName: 'work_period_payments', schema: config.DB_SCHEMA_NAME }, 'customer_rate', { transaction })
      await queryInterface.removeColumn({ tableName: 'work_period_payments', schema: config.DB_SCHEMA_NAME }, 'days', { transaction })
      await queryInterface.changeColumn({ tableName: 'work_period_payments', schema: config.DB_SCHEMA_NAME }, 'amount',
        { type: Sequelize.DOUBLE, allowNull: true },
        { transaction })
      await queryInterface.changeColumn({ tableName: 'work_period_payments', schema: config.DB_SCHEMA_NAME }, 'billing_account_id',
        { type: Sequelize.BIGINT, allowNull: true },
        { transaction })
      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  }
}
