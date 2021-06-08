'use strict';

const config = require('config')
const _ = require('lodash')
const { PaymentSchedulerStatus } = require('../app-constants')

/**
 * Create `payment_schedulers` table & relations.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()
    try { 
      await queryInterface.createTable('payment_schedulers', {
        id: {
          type: Sequelize.UUID,
          primaryKey: true,
          allowNull: false,
          defaultValue: Sequelize.UUIDV4
        },
        challengeId: {
          field: 'challenge_id',
          type: Sequelize.UUID,
          allowNull: false
        },
        workPeriodPaymentId: {
          field: 'work_period_payment_id',
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: {
              tableName: 'work_period_payments',
              schema: config.DB_SCHEMA_NAME
            },
            key: 'id'
          }
        },
        step: {
          type: Sequelize.ENUM(_.values(PaymentSchedulerStatus)),
          allowNull: false
        },
        status: {
          type: Sequelize.ENUM(
            'in-progress',
            'completed',
            'failed'
          ),
          allowNull: false
        },
        userId: {
          field: 'user_id',
          type: Sequelize.BIGINT
        },
        userHandle: {
          field: 'user_handle',
          type: Sequelize.STRING,
          allowNull: false
        },
        createdAt: {
          field: 'created_at',
          type: Sequelize.DATE
        },
        updatedAt: {
          field: 'updated_at',
          type: Sequelize.DATE
        },
        deletedAt: {
          field: 'deleted_at',
          type: Sequelize.DATE
        }
      }, { schema: config.DB_SCHEMA_NAME, transaction })
      await queryInterface.addColumn({ tableName: 'work_period_payments', schema: config.DB_SCHEMA_NAME }, 'status_details',
        { type: Sequelize.JSONB },
        { transaction })
      await queryInterface.changeColumn({ tableName: 'work_period_payments', schema: config.DB_SCHEMA_NAME }, 'challenge_id',
        { type: Sequelize.UUID },
        { transaction })
      await queryInterface.sequelize.query(`ALTER TYPE ${config.DB_SCHEMA_NAME}.enum_work_period_payments_status ADD VALUE 'scheduled'`)
      await queryInterface.sequelize.query(`ALTER TYPE ${config.DB_SCHEMA_NAME}.enum_work_period_payments_status ADD VALUE 'in-progress'`)
      await queryInterface.sequelize.query(`ALTER TYPE ${config.DB_SCHEMA_NAME}.enum_work_period_payments_status ADD VALUE 'failed'`)
      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  },

  down: async (queryInterface, Sequelize) => {
    const table = { schema: config.DB_SCHEMA_NAME, tableName: 'payment_schedulers' }
    const statusTypeName = `${table.schema}.enum_${table.tableName}_status`
    const stepTypeName = `${table.schema}.enum_${table.tableName}_step`
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.dropTable(table, { transaction })
      // drop enum type for status and step column
      await queryInterface.sequelize.query(`DROP TYPE ${statusTypeName}`, { transaction })
      await queryInterface.sequelize.query(`DROP TYPE ${stepTypeName}`, { transaction })

      await queryInterface.changeColumn({ tableName: 'work_period_payments', schema: config.DB_SCHEMA_NAME }, 'challenge_id',
        { type: Sequelize.UUID, allowNull: false },
        { transaction })
      await queryInterface.removeColumn({ tableName: 'work_period_payments', schema: config.DB_SCHEMA_NAME }, 'status_details',
        { transaction })
      await queryInterface.sequelize.query(`DELETE FROM pg_enum WHERE enumlabel in ('scheduled', 'in-progress', 'failed') AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_work_period_payments_status')`,
        { transaction })
      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  }
};
