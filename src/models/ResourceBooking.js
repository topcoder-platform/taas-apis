const { Sequelize, Model } = require('sequelize')
const config = require('config')
const errors = require('../common/errors')

module.exports = (sequelize) => {
  class ResourceBooking extends Model {
    /**
     * Create association between models
     * @param {Object} models the database models
     */
    static associate (models) {
      ResourceBooking.belongsTo(models.Job, { foreignKey: 'jobId' })
      ResourceBooking.hasMany(models.WorkPeriod, { foreignKey: 'resourceBookingId' })
    }

    /**
     * Get resource booking by id
     * @param {String} id the resource booking id
     * @returns {ResourceBooking} the resource booking instance
     */
    static async findById (id) {
      const resourceBooking = await ResourceBooking.findOne({
        where: {
          id
        }
      })
      if (!resourceBooking) {
        throw new errors.NotFoundError(`id: ${id} "ResourceBooking" doesn't exists.`)
      }
      return resourceBooking
    }
  }
  ResourceBooking.init(
    {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4
      },
      projectId: {
        field: 'project_id',
        type: Sequelize.INTEGER,
        allowNull: false
      },
      userId: {
        field: 'user_id',
        type: Sequelize.UUID,
        allowNull: false
      },
      jobId: {
        field: 'job_id',
        type: Sequelize.UUID
      },
      status: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      startDate: {
        field: 'start_date',
        type: Sequelize.DATEONLY
      },
      endDate: {
        field: 'end_date',
        type: Sequelize.DATEONLY
      },
      memberRate: {
        field: 'member_rate',
        type: Sequelize.FLOAT
      },
      customerRate: {
        field: 'customer_rate',
        type: Sequelize.FLOAT
      },
      rateType: {
        field: 'rate_type',
        type: Sequelize.STRING(255),
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
      tableName: 'resource_bookings',
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
        afterCreate: (resourceBooking) => {
          delete resourceBooking.dataValues.deletedAt
        }
      }
    }
  )

  return ResourceBooking
}
