/*
 * Add title field to the Job model.
 */

module.exports = {
  up: queryInterface => {
    return Promise.all([
      queryInterface.sequelize.query('ALTER TABLE bookings.jobs ADD title VARCHAR(64) NOT NULL')
    ])
  },
  down: queryInterface => {
    return Promise.all([
      queryInterface.sequelize.query('ALTER TABLE bookings.jobs DROP title')
    ])
  }
}
