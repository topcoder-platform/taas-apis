/*
 * Add title field to the Job model.
 */

module.exports = {
  up: queryInterface => {
    return Promise.all([
      queryInterface.sequelize.query('ALTER TABLE bookings.jobs ADD title VARCHAR(64)'),
      queryInterface.sequelize.query('UPDATE bookings.jobs SET title=description WHERE title is NULL'),
      queryInterface.sequelize.query('ALTER TABLE bookings.jobs ALTER COLUMN title SET NOT NULL')
    ])
  },
  down: queryInterface => {
    return Promise.all([
      queryInterface.sequelize.query('ALTER TABLE bookings.jobs DROP title')
    ])
  }
}
