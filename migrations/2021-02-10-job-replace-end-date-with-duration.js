/*
 * Replace endData with duration in Job model.
 */

module.exports = {
  up: queryInterface => {
    return Promise.all([
      queryInterface.sequelize.query('ALTER TABLE bookings.jobs DROP end_date'),
      queryInterface.sequelize.query('ALTER TABLE bookings.jobs ADD duration INTEGER')
    ])
  },
  down: queryInterface => {
    return Promise.all([
      queryInterface.sequelize.query('ALTER TABLE bookings.jobs ADD end_date DATE'),
      queryInterface.sequelize.query('ALTER TABLE bookings.jobs DROP duration')
    ])
  }
}
