/*
 * utility function that returns the model schema for
 * the JSONB array that maps to Nylas' opening_hours
 *
 */

const { Sequelize } = require('sequelize')
const { Interviews: InterviewConstants } = require('../../app-constants')

function nylasAvailableTimeSchema (fieldName) {
  return {
    field: fieldName,
    allowNull: false,
    type: Sequelize.JSONB({
      type: Sequelize.ARRAY({
        days: {
          type: Sequelize.ARRAY({
            type: Sequelize.ENUM(
              InterviewConstants.Nylas.Days.Monday,
              InterviewConstants.Nylas.Days.Tuesday,
              InterviewConstants.Nylas.Days.Wednesday,
              InterviewConstants.Nylas.Days.Thursday,
              InterviewConstants.Nylas.Days.Friday,
              InterviewConstants.Nylas.Days.Saturday,
              InterviewConstants.Nylas.Days.Sunday
            )
          })
        },
        end: {
          type: Sequelize.STRING(5),
          allowNull: false
        },
        start: {
          type: Sequelize.STRING(5),
          allowNull: false
        },
        allowNull: false
      }),
      allowNull: false
    })
  }
}
function nylasCalendarsSchema () {
  return {
    field: 'nylasCalendars',
    type: Sequelize.JSONB({
      type: Sequelize.ARRAY({
        accessToken: {
          field: 'accessToken',
          type: Sequelize.STRING(5),
          allowNull: false
        },
        accountId: {
          field: 'accountId',
          type: Sequelize.STRING(5),
          allowNull: false
        },
        accountProvider: {
          field: 'accountProvider',
          type: Sequelize.STRING(5),
          allowNull: false
        },
        id: {
          field: 'id',
          type: Sequelize.STRING(5),
          allowNull: false
        },
        isPrimary: {
          field: 'isPrimary',
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          allowNull: false
        },
        isDeleted: {
          field: 'isDeleted',
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          allowNull: false
        }
      }),
      allowNull: false
    })
  }
}

module.exports = {
  nylasAvailableTimeSchema,
  nylasCalendarsSchema
}
