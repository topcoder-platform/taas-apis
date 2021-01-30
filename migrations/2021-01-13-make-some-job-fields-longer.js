/*
 * Make some Job fields longer
 * title: 64 -> 128
 * description: change type to TEXT (unlimited length)
 */

module.exports = {
  up: queryInterface => {
    return Promise.all([
      queryInterface.sequelize.query('ALTER TABLE bookings.jobs ALTER COLUMN title TYPE VARCHAR(128)'),
      queryInterface.sequelize.query('ALTER TABLE bookings.jobs ALTER COLUMN description TYPE TEXT')
    ])
  },
  down: queryInterface => {
    return Promise.all([
      queryInterface.sequelize.query('ALTER TABLE bookings.jobs ALTER COLUMN title TYPE VARCHAR(64)'),
      queryInterface.sequelize.query('ALTER TABLE bookings.jobs ALTER COLUMN description TYPE VARCHAR(255)')
    ])
  }
}
