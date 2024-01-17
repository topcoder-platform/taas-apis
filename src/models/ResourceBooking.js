const { Sequelize, Model } = require('sequelize')
const config = require('config')
const _ = require('lodash')
const errors = require('../common/errors')

module.exports = (sequelize) => {
  class ResourceBooking extends Model {
    /**
     * Create association between models
     * @param {Object} models the database models
     */
    static associate (models) {
      ResourceBooking._models = models
      ResourceBooking.belongsTo(models.Job, { foreignKey: 'jobId' })
      ResourceBooking.hasMany(models.WorkPeriod, { as: 'workPeriods', foreignKey: 'resourceBookingId' })
    }

    /**
     * Get resource booking by id
     * @param {String} id the resource booking id
     * @returns {ResourceBooking} the resource booking instance
     */
    static async findById (id, options) {
      const criteria = {
        where: {
          id
        }
      }
      if (!_.isUndefined(options)) {
        // Select ResourceBooking fields
        if (options.include && options.include.length > 0) {
          criteria.attributes = options.fieldsRB
        } else if (options.excludeRB && options.excludeRB.length > 0) {
          criteria.attributes = { exclude: options.excludeRB }
        }
        // include WorkPeriod model
        if (options.withWorkPeriods) {
          criteria.include = [{
            model: ResourceBooking._models.WorkPeriod,
            as: 'workPeriods',
            required: false
          }]
          // Select WorkPeriod fields
          if (!options.allWorkPeriods) {
            if (options.fieldsWP && options.fieldsWP.length > 0) {
              criteria.include[0].attributes = _.map(options.fieldsWP, f => _.split(f, '.')[1])
            } else {
              // we should include at least one workPeriod field
              // if fields criteria has no workPeriod field but have workPeriodPayment field
              criteria.include[0].attributes = ['id']
            }
          } else if (options.excludeWP && options.excludeWP.length > 0) {
            criteria.include[0].attributes = { exclude: _.map(options.excludeWP, f => _.split(f, '.')[1]) }
          }
          // Include WorkPeriodPayment Model
          if (options.withWorkPeriodPayments) {
            criteria.include[0].include = [{
              model: ResourceBooking._models.WorkPeriodPayment,
              as: 'payments',
              required: false
            }]
            // Select WorkPeriodPayment fields
            if (!options.allWorkPeriodPayments) {
              criteria.include[0].include[0].attributes = _.map(options.fieldsWPP, f => _.split(f, '.')[2])
            } else if (options.excludeWPP && options.excludeWPP.length > 0) {
              criteria.include[0].include[0].attributes = { exclude: _.map(options.excludeWPP, f => _.split(f, '.')[2]) }
            }
          }
        }
      }
      const resourceBooking = await ResourceBooking.findOne(criteria)
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
        allowNull: true
      },
      tcUserId: {
        field: 'tc_user_id',
        type: Sequelize.INTEGER,
        allowNull: true // temporarly mark it nullable until historical data is processed
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
      sendWeeklySurvey: {
        field: 'send_weekly_survey',
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      billingAccountId: {
        field: 'billing_account_id',
        type: Sequelize.BIGINT
      },
      createdBy: {
        field: 'created_by',
        type: Sequelize.TEXT,
      },
      updatedBy: {
        field: 'updated_by',
        type: Sequelize.TEXT
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
