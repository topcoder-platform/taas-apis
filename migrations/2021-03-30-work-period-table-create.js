const config = require('config')

/*
 * Create work_periods table and reference to the "resource_bookings" table
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // because our migration have more than one step we use transaction
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.createTable('work_periods', {
        id: {
          type: Sequelize.UUID,
          primaryKey: true,
          allowNull: false,
          defaultValue: Sequelize.UUIDV4
        },
        resourceBookingId: {
          field: 'resource_booking_id',
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: {
              tableName: 'resource_bookings',
              schema: config.DB_SCHEMA_NAME
            },
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        userHandle: {
          field: 'user_handle',
          type: Sequelize.STRING(50),
          allowNull: false
        },
        projectId: {
          field: 'project_id',
          type: Sequelize.INTEGER,
          allowNull: false
        },
        startDate: {
          field: 'start_date',
          type: Sequelize.DATEONLY,
          allowNull: false
        },
        endDate: {
          field: 'end_date',
          type: Sequelize.DATEONLY,
          allowNull: false
        },
        daysWorked: {
          field: 'days_worked',
          type: Sequelize.INTEGER
        },
        memberRate: {
          field: 'member_rate',
          type: Sequelize.FLOAT
        },
        customerRate: {
          field: 'customer_rate',
          type: Sequelize.FLOAT
        },
        paymentStatus: {
          field: 'payment_status',
          type: Sequelize.STRING(50),
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
        schema: config.DB_SCHEMA_NAME,
        transaction
      })
      await queryInterface.addIndex(
        {
          tableName: 'work_periods',
          schema: config.DB_SCHEMA_NAME
        },
        ['resource_booking_id', 'start_date', 'end_date'],
        {
          type: 'UNIQUE',
          where: { deleted_at: null },
          transaction: transaction
        }
      )
      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable({
      tableName: 'work_periods',
      schema: config.DB_SCHEMA_NAME
    })
  }
}
