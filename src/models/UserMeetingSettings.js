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
     * @returns {UserMeetingSettings} the UserMeetingSettings instance
     */
    static async findById (id) {
      const userMeetingSettings = await UserMeetingSettings.findOne({
        where: {
          id: id
        }
      })
      if (!userMeetingSettings) {
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
      const calendar = await UserMeetingSettings.findById(id)
        .catch(() => null) // in case records is not found
        .then(ums => {
          // NOTE: ums can bee `null` here
          const calendars = _.get(ums, 'nylasCalendars', [])
          const notDeletedCalendars = _.reject(calendars, { isDeleted: true })
          return _.find(notDeletedCalendars, { isPrimary: true })
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
        type: Sequelize.STRING(255)
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
