/*
 * Add isApplicationPageActive field to the Job model.
 */

module.exports = {
  up: queryInterface => {
    return Promise.all([
      queryInterface.sequelize.query('ALTER TABLE bookings.jobs ADD is_application_page_active BOOLEAN NOT NULL DEFAULT false'),
      queryInterface.sequelize.query('UPDATE bookings.jobs SET is_application_page_active=false WHERE is_application_page_active is NULL'),
    ])
  },
  down: queryInterface => {
    return Promise.all([
      queryInterface.sequelize.query('ALTER TABLE bookings.jobs DROP is_application_page_active')
    ])
  }
}
