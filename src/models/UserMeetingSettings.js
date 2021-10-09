const { Sequelize, Model } = require('sequelize')
const _ = require('lodash')
const config = require('config')
const errors = require('../common/errors')
const { nylasAvailableTimeSchema, nylasCalendarsSchema } = require('../common/nylas')

module.exports = (sequelize) => {
  class UserMeetingSettings extends Model {
    /**
     * Get UserMeetingSettings by userId
     * @param {String} userId
     * @param {Boolean} throwOnError indicates whether it should throw on error or gracefully return null when not found
     * @returns {UserMeetingSettings} the UserMeetingSettings instance
     */
    static async findById (id, throwOnError = true) {
      const userMeetingSettings = await UserMeetingSettings.findOne({
        where: {
          id: id
        }
      })
      if (!userMeetingSettings && throwOnError === true) {
        throw new errors.NotFoundError(`id: ${id} "UserMeetingSettings" doesn't exist.`)
      }
      return userMeetingSettings
    }

    /**
     * Get UserMeetingSettings by userId
     * @param {String} userId
     * @returns {UserMeetingSettings} the NylasCalendar for the user
     */
    static async getPrimaryNylasCalendarForUser (id) {
      const calendar = await UserMeetingSettings.findById(id, false)
        .then(ums => {
          const calendars = _.get(ums, 'nylasCalendars')
          if (_.isEmpty(calendars)) {
            return null
          }
          return calendars.filter(c => c.isPrimary)[0]
        })

      return calendar
    }
  }
  UserMeetingSettings.init(
    {
      id: {
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
      tableName: 'user_meeting_settings',
      paranoid: false,
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
        afterCreate: (workPeriodPayment) => {
          delete workPeriodPayment.dataValues.deletedAt
        }
      }
    }
  )

  return UserMeetingSettings
}
