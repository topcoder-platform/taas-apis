'use strict';
const config = require('config')

/**
 * Migrate work_period_payments challenge_id - from not null to allow null.
 * enum_work_period_payments_status from completed, cancelled to completed, canceled, scheduled.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = { tableName: 'work_period_payments', schema: config.DB_SCHEMA_NAME }
    await Promise.all([
      queryInterface.changeColumn(table, 'challenge_id', { type: Sequelize.UUID }),
      queryInterface.sequelize.query(`ALTER TYPE ${config.DB_SCHEMA_NAME}.enum_work_period_payments_status ADD VALUE 'scheduled'`)
    ])
  },

  down: async (queryInterface, Sequelize) => {
    const table = { tableName: 'work_period_payments', schema: config.DB_SCHEMA_NAME }
    await Promise.all([
      queryInterface.changeColumn(table, 'challenge_id', { type: Sequelize.UUID, allowNull: false }),
      queryInterface.sequelize.query(`
        DELETE 
        FROM
            pg_enum
        WHERE
            enumlabel = 'scheduled' AND
            enumtypid = (
                SELECT
                    oid
                FROM
                    pg_type
                WHERE
                    typname = 'enum_work_period_payments_status'
            )
      `)
    ])
  }
};
