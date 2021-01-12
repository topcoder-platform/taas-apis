/*
 * Add externalId and resume fields to the JobCandidate model.
 */

module.exports = {
  up: queryInterface => {
    return Promise.all([
      queryInterface.sequelize.query('ALTER TABLE bookings.job_candidates ADD external_id VARCHAR(255)'),
      queryInterface.sequelize.query('ALTER TABLE bookings.job_candidates ADD resume VARCHAR(2048)')
    ])
  },
  down: queryInterface => {
    return Promise.all([
      queryInterface.sequelize.query('ALTER TABLE bookings.job_candidates DROP external_id'),
      queryInterface.sequelize.query('ALTER TABLE bookings.job_candidates DROP resume')
    ])
  }
}
