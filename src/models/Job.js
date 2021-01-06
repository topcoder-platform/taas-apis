
const { Sequelize, Model } = require('sequelize')
const config = require('config')
const errors = require('../common/errors')

module.exports = (sequelize) => {
  class Job extends Model {
    /**
     * Create association between models
     * @param {Object} models the database models
     */
    static associate (models) {
      Job._models = models
      Job.hasMany(models.JobCandidate, { as: 'candidates', foreignKey: 'jobId' })
      Job.hasMany(models.ResourceBooking, { foreignKey: 'jobId' })
    }

    /**
     * Get job by id
     * @param {String} id the job id
     * @param {Boolean} withCandidates whether contains candidates
     * @returns {Job} the Job instance
     */
    static async findById (id, withCandidates = false) {
      const criteria = {
        where: {
          id,
          deletedAt: null
        },
        attributes: {
          exclude: ['deletedAt']
        }
      }
      if (withCandidates) {
        criteria.include = [{
          model: Job._models.JobCandidate,
          as: 'candidates',
          where: {
            deletedAt: null
          },
          required: false,
          attributes: {
            exclude: ['deletedAt']
          }
        }]
      }
      const job = await Job.findOne(criteria)
      if (!job) {
        throw new errors.NotFoundError(`id: ${id} "Job" doesn't exists.`)
      }
      return job
    }
  }
  Job.init(
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
      externalId: {
        field: 'external_id',
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.STRING,
        allowNull: false
      },
      title: {
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
      numPositions: {
        field: 'num_positions',
        type: Sequelize.INTEGER,
        allowNull: false
      },
      resourceType: {
        field: 'resource_type',
        type: Sequelize.STRING,
        allowNull: false
      },
      rateType: {
        field: 'rate_type',
        type: Sequelize.STRING,
        allowNull: false
      },
      workload: {
        field: 'workload',
        type: Sequelize.STRING,
        allowNull: false
      },
      skills: {
        type: Sequelize.JSONB,
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
      tableName: 'jobs',
      timestamps: false
    }
  )

  return Job
}
