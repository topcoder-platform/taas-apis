const { Sequelize, Model } = require('sequelize')
const config = require('config')
const errors = require('../common/errors')

module.exports = (sequelize) => {
  class PaymentScheduler extends Model {
    /**
     * Create association between models
     * @param {Object} models the database models
     */
    static associate (models) {
      PaymentScheduler.belongsTo(models.WorkPeriodPayment, { foreignKey: 'workPeriodPaymentId' })
    }

    /**
     * Get payment scheduler by id
     * @param {String} id the payment scheduler id
     * @returns {PaymentScheduler} the payment scheduler instance
     */
    static async findById (id) {
      const paymentScheduler = await PaymentScheduler.findOne({
        where: {
          id
        }
      })
      if (!paymentScheduler) {
        throw new errors.NotFoundError(`id: ${id} "paymentScheduler" doesn't exists`)
      }
      return paymentScheduler
    }
  }
  PaymentScheduler.init(
    {
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
        allowNull: false
      },
      step: {
        type: Sequelize.INTEGER,
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
    },
    {
      schema: config.DB_SCHEMA_NAME,
      sequelize,
      tableName: 'payment_schedulers',
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
        afterCreate: (paymentScheduler) => {
          delete paymentScheduler.dataValues.deletedAt
        }
      }
    }
  )

  return PaymentScheduler
}
