/**
 * Create work_period_payments table and reference to the "work_periods" table
 */

const config = require('config') 
 
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('work_period_payment', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4
      },
      workPeriodId: {
        field: 'work_period_id',
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: {
            tableName: 'work_periods',
            schema: config.DB_SCHEMA_NAME
          },
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      challengeId: {
        field: 'challenge_id',
        type: Sequelize.UUID,
        allowNull: false,
        defaultValue: '00000000-0000-0000-0000-000000000000'
      },
      amount: {
        type: Sequelize.DOUBLE
      },
      status: {
        type: Sequelize.ENUM(
          'completed',
          'cancelled'
        ),
        allowNull: false
      },
      createdBy: {
        field: 'created_by',
        type: Sequelize.UUID,
        allowNull: false
      },
      updatedBy: {
        field: 'updated_by',
        type: Sequelize.UUID
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
    }, {
      schema: 'bookings',
      transaction
    })
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable({
      tableName: 'work_period_payments',
      schema: config.DB_SCHEMA_NAME
    })
  }
}
 