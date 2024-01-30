const config = require('config')
const ResourceBooking = require('../src/models').ResourceBooking
const _ = require('lodash')
const helper = require('../src/common/helper')
const { v4: uuid } = require('uuid')

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
      const resourceBookings = await ResourceBooking.findAll({
        where: {
          start_date: { [Op.lt]: new Date(MAX_START_DATE) },
          end_date: { [Op.lt]: new Date(MAX_END_DATE) }
        }
      })
      if (resourceBookings.length === 0) {
        await transaction.rollback()
        return
      }
      const workPeriodData = []
      await Promise.all(resourceBookings.map(async rb => {
        if (!_.isNil(rb.startDate) && !_.isNil(rb.endDate)) {
          const periods = helper.extractWorkPeriods(rb.startDate, rb.endDate)
          let tcUser = await helper.ensureTopcoderUserIdExists(rb.userId)
          _.forEach(periods, period => {
            workPeriodData.push({
              id: uuid(),
              resource_booking_id: rb.id,
              project_id: rb.projectId,
              user_handle: tcUser.handleLower,
              start_date: period.startDate,
              end_date: period.endDate,
              days_worked: null,
              payment_status: 'pending',
              created_by: config.m2m.M2M_AUDIT_USER_ID,
              created_at: new Date()
            })
          })
        }
      }))
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
      const Op = Sequelize.Op
      const resourceBookings = await ResourceBooking.findAll({
        where: {
          start_date: { [Op.lt]: new Date(MAX_START_DATE) },
          end_date: { [Op.lt]: new Date(MAX_END_DATE) }
        },
        // include soft-deleted resourceBookings
        paranoid: false
      })
      const resourceBookingIds = _.map(resourceBookings, rb => rb.dataValues.id)

      await queryInterface.bulkDelete({ tableName: 'work_periods', schema: config.DB_SCHEMA_NAME },
        { resource_booking_id: { [Op.in]: resourceBookingIds } }, { transaction })
      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  }
}
