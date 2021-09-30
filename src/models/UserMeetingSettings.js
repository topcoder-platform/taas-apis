const { Sequelize, Model } = require('sequelize')
const config = require('config')
const _ = require('lodash')
const errors = require('../common/errors')
const { nylasAvailableTimeSchema, nylasCalendarsSchema } = require('../common/nylas')


module.exports = (sequelize) => {
  class UserMeetingSettings extends Model {
    /**
     * Create association between models
     * @param {Object} models the database models
     */
    static associate (models) {
      //UserMeetingSettings.belongsTo(models.JobCandidate, { foreignKey: 'jobCandidateId' })
    }

    /**
     * Get interview by id
     * @param {String} id the interview id
     * @returns {UserMeetingSettings} the UserMeetingSettings instance
     */
    static async findById (id) {
      const interview = await UserMeetingSettings.findOne({
        where: {
          userId: id
        }
      })
      if (!interview) {
        throw new errors.NotFoundError(`id: ${id} "UserMeetingSettings" doesn't exist.`)
      }
      return interview
    }
  }
  UserMeetingSettings.init(
    {
      userId: {
        field: 'user_id',
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4
      },
      defaultAvailableTime: nylasAvailableTimeSchema('defaultAvailableTime'),
      defaultTimezone: {
        field: 'defaultTimezone',
        type: Sequelize.STRING(255),
        allowNull: false
      },
      nylasCalendars: nylasCalendarsSchema(),
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

  return UserMeetingSettings
}
