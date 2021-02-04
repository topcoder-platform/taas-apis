/*
 * Add a duration field to the Job model and the ResourceBooking model each.
 */

module.exports = {
  up: queryInterface => {
    return Promise.all([
      queryInterface.sequelize.query('ALTER TABLE bookings.jobs ADD duration INTEGER')
    ])
  },
  down: queryInterface => {
    return Promise.all([
      queryInterface.sequelize.query('ALTER TABLE bookings.jobs DROP duration')
    ])
  }
}
