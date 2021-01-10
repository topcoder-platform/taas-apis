/*
 * Make Job fields externalId, description, startDate, endDate, resourceType, rateType and workload optional.
 */

const targetFields = [
  'external_id',
  'description',
  'start_date',
  'end_date',
  'resource_type',
  'rate_type',
  'workload'
]

module.exports = {
  up: queryInterface => {
    return Promise.all(targetFields.map(field =>
      queryInterface.sequelize.query(`ALTER TABLE bookings.jobs ALTER COLUMN ${field} DROP NOT NULL`)
    ))
  },
  down: queryInterface => {
    return Promise.all(targetFields.map(field =>
      queryInterface.sequelize.query(`ALTER TABLE bookings.jobs ALTER COLUMN ${field} SET NOT NULL`)
    ))
  }
}
