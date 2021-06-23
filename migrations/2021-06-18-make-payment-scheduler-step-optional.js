const config = require('config')
const _ = require('lodash')
const { PaymentSchedulerStatus } = require('../app-constants')
/*
 * Make Job payment_schedulers step optional.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`ALTER TABLE ${config.DB_SCHEMA_NAME}.payment_schedulers ALTER COLUMN step DROP NOT NULL`)
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`ALTER TABLE ${config.DB_SCHEMA_NAME}.payment_schedulers ALTER COLUMN step SET NOT NULL`)
  }
}