const { Sequelize, Model } = require('sequelize')
const config = require('config')
const _ = require('lodash')
const { Interviews } = require('../../app-constants')
const errors = require('../common/errors')

// allowed status values
const statuses = _.values(Interviews.Status)

module.exports = (sequelize) => {
  class Interview extends Model {
    /**
     * Create association between models
     * @param {Object} models the database models
     */
    static associate (models) {
      Interview.belongsTo(models.JobCandidate, { foreignKey: 'jobCandidateId' })
    }

    /**
     * Get interview by id
     * @param {String} id the interview id
     * @returns {Interview} the Interview instance
     */
    static async findById (id) {
      const interview = await Interview.findOne({
        where: {
          id
        }
      })
      if (!interview) {
        throw new errors.NotFoundError(`id: ${id} "Interview" doesn't exist.`)
      }
      return interview
    }
  }
  Interview.init(
    {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4
      },
      jobCandidateId: {
        field: 'job_candidate_id',
        type: Sequelize.UUID,
        allowNull: false
      },
      googleCalendarId: {
        field: 'google_calendar_id',
        type: Sequelize.STRING(255)
      },
      customMessage: {
        field: 'custom_message',
        type: Sequelize.TEXT
      },
      xaiTemplate: {
        field: 'xai_template',
        type: Sequelize.STRING(255),
        allowNull: false
      },
      round: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM(statuses),
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
      tableName: 'interviews',
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
        afterCreate: (interview) => {
          delete interview.dataValues.deletedAt
        }
      }
    }
  )

  return Interview
}
