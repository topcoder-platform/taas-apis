const { Sequelize, Model } = require('sequelize')
const config = require('config')
const errors = require('../common/errors')

module.exports = (sequelize) => {
  class JobCandidate extends Model {
    /**
     * Create association between models
     * @param {Object} models the database models
     */
    static associate (models) {
      JobCandidate._models = models
      JobCandidate.belongsTo(models.Job, { foreignKey: 'jobId' })
      JobCandidate.hasMany(models.Interview, { foreignKey: 'jobCandidateId', as: 'interviews' })
    }

    /**
     * Get job candidate by id
     * @param {String} id the job candidate id
     * @param {Array} include include options
     * @returns {JobCandidate} the JobCandidate instance
     */
    static async findById (id, include = []) {
      const jobCandidate = await JobCandidate.findOne({
        where: {
          id
        },
        include
      })
      if (!jobCandidate) {
        throw new errors.NotFoundError(`id: ${id} "JobCandidate" doesn't exists.`)
      }
      return jobCandidate
    }
  }
  JobCandidate.init(
    {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4
      },
      jobId: {
        field: 'job_id',
        type: Sequelize.UUID,
        allowNull: false
      },
      userId: {
        field: 'user_id',
        type: Sequelize.UUID,
        allowNull: false
      },
      viewedByCustomer: {
        field: 'viewed_by_customer',
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      status: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      externalId: {
        field: 'external_id',
        type: Sequelize.STRING(255)
      },
      resume: {
        type: Sequelize.STRING(2048)
      },
      remark: {
        type: Sequelize.STRING(255)
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
      tableName: 'job_candidates',
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
        afterCreate: (jobCandidate) => {
          delete jobCandidate.dataValues.deletedAt
        },
        afterDestroy: async (jobCandidate) => {
          // cascade (soft) delete interviews associated with this jobCandidate
          const jobCandidateId = jobCandidate.id
          await sequelize.models.Interview.destroy({
            where: { jobCandidateId }
          })
        }
      }
    }
  )

  return JobCandidate
}
