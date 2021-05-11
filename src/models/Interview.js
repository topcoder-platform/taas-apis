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
      xaiId: {
        field: 'xai_id',
        type: Sequelize.STRING(255)
      },
      jobCandidateId: {
        field: 'job_candidate_id',
        type: Sequelize.UUID,
        allowNull: false
      },
      calendarEventId: {
        field: 'calendar_event_id',
        type: Sequelize.STRING(255)
      },
      templateUrl: {
        field: 'template_url',
        type: Sequelize.STRING(255),
        allowNull: false
      },
      templateId: {
        field: 'template_id',
        type: Sequelize.STRING(255)
      },
      templateType: {
        field: 'template_type',
        type: Sequelize.STRING(255)
      },
      title: {
        field: 'title',
        type: Sequelize.STRING(255)
      },
      locationDetails: {
        field: 'location_details',
        type: Sequelize.STRING(255)
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
      hostName: {
        field: 'host_name',
        type: Sequelize.STRING(255)
      },
      hostEmail: {
        field: 'host_email',
        type: Sequelize.STRING(255)
      },
      guestNames: {
        field: 'guest_names',
        type: Sequelize.ARRAY(Sequelize.STRING)
      },
      guestEmails: {
        field: 'guest_emails',
        type: Sequelize.ARRAY(Sequelize.STRING)
      },
      status: {
        type: Sequelize.ENUM(statuses),
        allowNull: false
      },
      rescheduleUrl: {
        field: 'reschedule_url',
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
