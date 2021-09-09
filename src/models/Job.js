
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
          id
        }
      }
      if (withCandidates) {
        criteria.include = [{
          model: Job._models.JobCandidate,
          as: 'candidates',
          required: false
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
        type: Sequelize.STRING(255)
      },
      description: {
        type: Sequelize.TEXT // technically unlimited length
      },
      title: {
        type: Sequelize.STRING(128),
        allowNull: false
      },
      startDate: {
        field: 'start_date',
        type: Sequelize.DATEONLY
      },
      duration: {
        field: 'duration',
        type: Sequelize.INTEGER
      },
      numPositions: {
        field: 'num_positions',
        type: Sequelize.INTEGER,
        allowNull: false
      },
      resourceType: {
        field: 'resource_type',
        type: Sequelize.STRING(255)
      },
      rateType: {
        field: 'rate_type',
        type: Sequelize.STRING(255)
      },
      workload: {
        field: 'workload',
        type: Sequelize.STRING(45)
      },
      skills: {
        type: Sequelize.JSONB,
        allowNull: false
      },
      status: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      isApplicationPageActive: {
        field: 'is_application_page_active',
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      minSalary: {
        field: 'min_salary',
        type: Sequelize.INTEGER,
        allowNull: true
      },
      maxSalary: {
        field: 'max_salary',
        type: Sequelize.INTEGER,
        allowNull: true
      },
      hoursPerWeek: {
        field: 'hours_per_week',
        type: Sequelize.INTEGER,
        allowNull: true
      },
      jobLocation: {
        field: 'job_location',
        type: Sequelize.STRING(255),
        allowNull: true
      },
      jobTimezone: {
        field: 'job_timezone',
        type: Sequelize.STRING(128),
        allowNull: true
      },
      currency: {
        field: 'currency',
        type: Sequelize.STRING(30),
        allowNull: true
      },
      roleIds: {
        field: 'role_ids',
        type: Sequelize.ARRAY({
          type: Sequelize.UUID
        })
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
      tableName: 'jobs',
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
        afterCreate: (job) => {
          delete job.dataValues.deletedAt
        }
      }
    }
  )

  return Job
}
