const { Sequelize, Model } = require('sequelize')
const config = require('config')
const _ = require('lodash')
const { Interviews } = require('../../app-constants')
const errors = require('../common/errors')
const { nylasAvailableTimeSchema } = require('../common/nylas')

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
      nylasPageId: {
        field: 'nylas_page_id',
        type: Sequelize.STRING(255),
        allowNull: false
      },
      nylasPageSlug: {
        field: 'nylas_page_slug',
        type: Sequelize.STRING(255),
        allowNull: false
      },
      nylasCalendarId: {
        field: 'nylas_calendar_id',
        type: Sequelize.STRING(255),
        allowNull: false
      },
      timezone: {
        field: 'timezone',
        type: Sequelize.STRING(255),
        allowNull: false
      },
      availableTime: nylasAvailableTimeSchema('availableTime'),
      hostUserId: {
        field: 'hostUserId',
        type: Sequelize.UUID,
        allowNull: false
      },
      expireTimestamp: {
        field: 'expireTimestamp',
        type: Sequelize.DATE,
        allowNull: true
      },
      jobCandidateId: {
        field: 'job_candidate_id',
        type: Sequelize.UUID,
        allowNull: false
      },
      duration: {
        field: 'duration',
        type: Sequelize.INTEGER
      },
      round: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      startTimestamp: {
        field: 'start_timestamp',
        type: Sequelize.DATE
      },
      endTimestamp: {
        field: 'end_timestamp',
        type: Sequelize.DATE
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
      paranoid: false,
      deletedAt: 'deletedAt',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      timestamps: true
    }
  )

  return Interview
}
