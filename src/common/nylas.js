/*
 * utility function that returns the model schema for 
 * the JSONB array that maps to Nylas' opening_hours
 *
 */


const { Sequelize } = require('sequelize')

function nylasAvailableTimeSchema(fieldName) {
  return {
      field: fieldName,
      allowNull: false,
      type: Sequelize.ARRAY({
        type: Sequelize.JSONB({
          days: {
            type: Sequelize.ENUM(
              'M',
              'T',
              'W',
              'R',
              'F',
              'S',
              'U'
            ),
          },
          end: {
            type: Sequelize.STRING(5),
            allowNull: false
          },
          start: {
            type: Sequelize.STRING(5),
            allowNull: false
          },    
          allowNull: false,
        }),
      allowNull: false
      })
  }
}
function nylasCalendarsSchema() {
  return {
    field: 'nylasCalendars',
    type: Sequelize.ARRAY({
      type: Sequelize.JSONB({
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
          allowNull: false
        },                         
      }),
    allowNull: false
    }),
  }
}

module.exports = {
  nylasAvailableTimeSchema,
  nylasCalendarsSchema,
}