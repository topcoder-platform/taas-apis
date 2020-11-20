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
    }

    /**
     * Get resource booking by id
     * @param {String} id the resource booking id
     * @returns {ResourceBooking} the resource booking instance
     */
    static async findById (id) {
      const resourceBooking = await ResourceBooking.findOne({
        where: {
          id,
          deletedAt: null
        },
        attributes: {
          exclude: ['deletedAt']
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
        type: Sequelize.STRING,
        allowNull: false
      },
      startDate: {
        field: 'start_date',
        type: Sequelize.DATE,
        allowNull: false
      },
      endDate: {
        field: 'end_date',
        type: Sequelize.DATE,
        allowNull: false
      },
      memberRate: {
        field: 'member_rate',
        type: Sequelize.FLOAT,
        allowNull: false
      },
      customerRate: {
        field: 'customer_rate',
        type: Sequelize.FLOAT,
        allowNull: false
      },
      rateType: {
        field: 'rate_type',
        type: Sequelize.STRING,
        allowNull: false
      },
      createdAt: {
        field: 'created_at',
        type: Sequelize.DATE,
        allowNull: false
      },
      createdBy: {
        field: 'created_by',
        type: Sequelize.UUID,
        allowNull: false
      },
      updatedAt: {
        field: 'updated_at',
        type: Sequelize.DATE
      },
      updatedBy: {
        field: 'updated_by',
        type: Sequelize.UUID
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
      timestamps: false
    }
  )

  return ResourceBooking
}
