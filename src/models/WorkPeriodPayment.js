const { Sequelize, Model } = require('sequelize')
const _ = require('lodash')
const config = require('config')
const errors = require('../common/errors')
const { WorkPeriodPaymentStatus } = require('../../app-constants')

module.exports = (sequelize) => {
  class WorkPeriodPayment extends Model {
    /**
     * Create association between models
     * @param {Object} models the database models
     */
    static associate (models) {
      WorkPeriodPayment.belongsTo(models.WorkPeriod, { foreignKey: 'workPeriodId' })
    }

    /**
     * Get work period by id
     * @param {String} id the work period id
     * @returns {WorkPeriodPayment} the work period payment instance
     */
    static async findById (id) {
      const workPeriodPayment = await WorkPeriodPayment.findOne({
        where: {
          id
        }
      })
      if (!workPeriodPayment) {
        throw new errors.NotFoundError(`id: ${id} "WorkPeriodPayment" doesn't exists`)
      }
      return workPeriodPayment
    }
  }
  WorkPeriodPayment.init(
    {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4
      },
      workPeriodId: {
        field: 'work_period_id',
        type: Sequelize.UUID,
        allowNull: false
      },
      challengeId: {
        field: 'challenge_id',
        type: Sequelize.UUID
      },
      amount: {
        type: Sequelize.DOUBLE
      },
      status: {
        type: Sequelize.ENUM(_.values(WorkPeriodPaymentStatus)),
        allowNull: false
      },
      statusDetails: {
        field: 'status_details',
        type: Sequelize.JSONB
      },
      billingAccountId: {
        field: 'billing_account_id',
        type: Sequelize.BIGINT
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
      tableName: 'work_period_payments',
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
        afterCreate: (workPeriodPayment) => {
          delete workPeriodPayment.dataValues.deletedAt
        }
      }
    }
  )

  return WorkPeriodPayment
}
