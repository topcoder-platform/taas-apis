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

    /**
     * Get interview by Nylas Event Id
     * @param {String} nylasEventId Nylas Event Id
     * @returns {Interview} the Interview instance
     */
    static async findByNylasEventId (nylasEventId) {
      const interview = await Interview.findOne({
        where: {
          nylasEventId
        }
      })
      if (!interview) {
        throw new errors.NotFoundError(`"Interview" doesn't exist with nylasEventId: "${nylasEventId}"`)
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
      nylasEventId: {
        field: 'nylas_event_id',
        type: Sequelize.STRING(255),
        allowNull: true,
        defaultValue: null
      },
      nylasEventEditHash: {
        field: 'nylas_event_edit_hash',
        type: Sequelize.STRING(255),
        allowNull: true,
        defaultValue: null
      },
      hostTimezone: {
        field: 'host_timezone',
        type: Sequelize.STRING(255),
        allowNull: false
      },
      guestTimezone: {
        field: 'guest_timezone',
        type: Sequelize.STRING(255),
        allowNull: true
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
      zoomAccountApiKey: {
        field: 'zoom_account_api_key',
        type: Sequelize.STRING(255),
        allowNull: true
      },
      zoomMeetingId: {
        field: 'zoom_meeting_id',
        type: Sequelize.BIGINT,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM(statuses),
        allowNull: false
      },
      createdBy: {
        field: 'created_by',
        type: Sequelize.TEXT
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
