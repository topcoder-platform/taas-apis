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
