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
    }

    /**
     * Get job candidate by id
     * @param {String} id the job candidate id
     * @returns {JobCandidate} the JobCandidate instance
     */
    static async findById (id) {
      const jobCandidate = await JobCandidate.findOne({
        where: {
          id,
          deletedAt: null
        },
        attributes: {
          exclude: ['deletedAt']
        }
      })
      if (!jobCandidate) {
        throw new errors.NotFoundError(`id: ${id} "JobCandidate" doesn't exists.`)
      }
      return jobCandidate
    }

    static async getProjectId (jobId) {
      try {
        const job = await JobCandidate._models.Job.findById(jobId)
        return job.dataValues.projectId
      } catch (error) {
        return null
      }
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
      status: {
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
      tableName: 'job_candidates',
      timestamps: false
    }
  )

  return JobCandidate
}
