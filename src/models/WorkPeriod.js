const { Sequelize, Model } = require('sequelize')
const config = require('config')
const errors = require('../common/errors')

module.exports = (sequelize) => {
  class WorkPeriod extends Model {
    /**
     * Create association between models
     * @param {Object} models the database models
     */
    static associate (models) {
      WorkPeriod._models = models
      WorkPeriod.belongsTo(models.ResourceBooking, { foreignKey: 'resourceBookingId' })
      WorkPeriod.hasMany(models.WorkPeriodPayment, { as: 'payments', foreignKey: 'workPeriodId' })
    }

    /**
     * Get work period by id
     * @param {String} id the work period id
     * @param {Object} options { withPayments: true/false } whether contains payments
     * @returns {WorkPeriod} the work period instance
     */
    static async findById (id, options = { withPayments: false, exclude: [] }) {
      const criteria = {
        where: {
          id
        }
      }
      if (options.exclude && options.exclude.length > 0) {
        criteria.attributes = { exclude: options.exclude }
      }
      if (options.withPayments) {
        criteria.include = [{
          model: WorkPeriod._models.WorkPeriodPayment,
          as: 'payments',
          required: false
        }]
      }
      const workPeriod = await WorkPeriod.findOne(criteria)
      if (!workPeriod) {
        throw new errors.NotFoundError(`id: ${id} "WorkPeriod" doesn't exists.`)
      }
      return workPeriod
    }
  }
  WorkPeriod.init(
    {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4
      },
      resourceBookingId: {
        field: 'resource_booking_id',
        type: Sequelize.UUID,
        allowNull: false
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
        type: Sequelize.INTEGER,
        allowNull: false
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
    },
    {
      schema: config.DB_SCHEMA_NAME,
      sequelize,
      tableName: 'work_periods',
      paranoid: true,
      deletedAt: 'deletedAt',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      timestamps: true,
      defaultScope: {
        attributes: {
          exclude: ['deletedAt']
        }
      },
      hooks: {
        afterCreate: (workPeriod) => {
          delete workPeriod.dataValues.deletedAt
        }
      },
      indexes: [
        {
          unique: true,
          fields: ['resource_booking_id', 'start_date', 'end_date'],
          where: {
            deleted_at: null
          }
        }
      ]
    }
  )

  return WorkPeriod
}
