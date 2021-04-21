'use strict';

const config = require('config')
const _ = require('lodash')
const { Interviews } = require('../app-constants')

// allowed status values
const statuses = _.values(Interviews.Status)

/**
 * Create `interviews` table & relations.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = { schema: config.DB_SCHEMA_NAME, tableName: 'interviews' }
    await queryInterface.createTable(table, {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4
      },
      jobCandidateId: {
        field: 'job_candidate_id',
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: {
            tableName: 'job_candidates',
            schema: config.DB_SCHEMA_NAME
          },
          key: 'id'
        }
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
    }, { schema: config.DB_SCHEMA_NAME })
  },

  down: async (queryInterface, Sequelize) => {
    const table = { schema: config.DB_SCHEMA_NAME, tableName: 'interviews' }
    const statusTypeName = `${table.schema}.enum_${table.tableName}_status`
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.dropTable(table, { transaction })
      // drop enum type for status column
      await queryInterface.sequelize.query(`DROP TYPE ${statusTypeName}`, { transaction })
      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  }
};
