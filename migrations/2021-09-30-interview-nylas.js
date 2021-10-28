const config = require('config')
const { Interviews } = require('../app-constants')

/*
 * Add show_in_hot_list, featured, hot_list_excerpt and job_tag to the Job model.
type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
 */


const { nylasAvailableTimeSchema, nylasCalendarsSchema } = require('../src/common/nylas')


module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()
    const interviewsTable = { tableName: 'interviews', schema: config.DB_SCHEMA_NAME }
    const jobCandidatesTable = { tableName: 'job_candidates', schema: config.DB_SCHEMA_NAME }
    try {
      // log which Job Candidates in "interview" status would become "open" to be aware
      const jcWithInterview = await queryInterface.sequelize.query(`SELECT id FROM bookings.job_candidates WHERE status = 'interview';`)
      const jcIds = jcWithInterview[0].map(jc => jc.id)
      console.log(`NOTE: Job Candidates in "interview" status which would become "open" again, total: ${jcIds.length}, ids: ${jcIds.join(', ')}`)

      // update all existent Job Candidates which are in the interview process to come back to `open` status
      await queryInterface.bulkUpdate(jobCandidatesTable,
        {
          status: 'open'
        },
        {
          status: 'interview'
        }
      );

      // remove all existent interview records as they are not compatible with new workflow
      await queryInterface.bulkDelete(interviewsTable, {}, { transaction })

      // remove not needed columns from interviews
      await queryInterface.removeColumn(interviewsTable, 'xai_id', { transaction })
      await queryInterface.removeColumn(interviewsTable, 'calendar_event_id', { transaction })
      await queryInterface.removeColumn(interviewsTable, 'template_url', { transaction })
      await queryInterface.removeColumn(interviewsTable, 'template_id', { transaction })
      await queryInterface.removeColumn(interviewsTable, 'template_type', { transaction })
      await queryInterface.removeColumn(interviewsTable, 'location_details', { transaction })
      await queryInterface.removeColumn(interviewsTable, 'reschedule_url', { transaction })
      await queryInterface.removeColumn(interviewsTable, 'title', { transaction })
      await queryInterface.removeColumn(interviewsTable, 'host_name', { transaction })
      await queryInterface.removeColumn(interviewsTable, 'host_email', { transaction })
      await queryInterface.removeColumn(interviewsTable, 'guest_names', { transaction })
      await queryInterface.removeColumn(interviewsTable, 'guest_emails', { transaction })

      //add columns to interviews
      await queryInterface.addColumn(interviewsTable, 'nylas_page_id', { type: Sequelize.STRING(255), allowNull: false}, { transaction })
      await queryInterface.addColumn(interviewsTable, 'nylas_page_slug', { type: Sequelize.STRING(255), allowNull: false}, { transaction })
      await queryInterface.addColumn(interviewsTable, 'nylas_calendar_id', { type: Sequelize.STRING(255), allowNull: false}, { transaction })
      await queryInterface.addColumn(interviewsTable, 'timezone', { type: Sequelize.STRING(255), allowNull: false}, { transaction })
      await queryInterface.addColumn(interviewsTable, 'availableTime', nylasAvailableTimeSchema('availableTime'), { transaction })
      await queryInterface.addColumn(interviewsTable, 'hostUserId', { type: Sequelize.UUID, allowNull: false}, { transaction })
      await queryInterface.addColumn(interviewsTable, 'expireTimestamp', { type: Sequelize.DATE, allowNull: true}, { transaction })
      //new UserMeetingSettings
      await queryInterface.createTable('user_meeting_settings',
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
      }, { schema: config.DB_SCHEMA_NAME, transaction })


      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  },
  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()
    const interviewsTable = { tableName: 'interviews', schema: config.DB_SCHEMA_NAME }
    try {

      await queryInterface.dropTable('user_meeting_settings', { transaction })

      await queryInterface.removeColumn(interviewsTable, 'nylas_page_id', { transaction })
      await queryInterface.removeColumn(interviewsTable, 'nylas_page_slug', { transaction })
      await queryInterface.removeColumn(interviewsTable, 'nylas_calendar_id', { transaction })
      await queryInterface.removeColumn(interviewsTable, 'timezone', { transaction })
      await queryInterface.removeColumn(interviewsTable, 'availableTime', { transaction })
      await queryInterface.removeColumn(interviewsTable, 'hostUserId', { transaction })
      await queryInterface.removeColumn(interviewsTable, 'expireTimestamp', { transaction })

      await queryInterface.addColumn(interviewsTable, 'xai_id', { type: Sequelize.STRING(255) }, { transaction })
      await queryInterface.addColumn(interviewsTable, 'calendar_event_id', { type: Sequelize.STRING(255) }, { transaction })
      await queryInterface.addColumn(interviewsTable, 'template_url', { type: Sequelize.STRING(255) }, { transaction })
      await queryInterface.addColumn(interviewsTable, 'template_id', { type: Sequelize.STRING(255) }, { transaction })
      await queryInterface.addColumn(interviewsTable, 'template_type', { type: Sequelize.STRING(255) }, { transaction })
      await queryInterface.addColumn(interviewsTable, 'location_details', { type: Sequelize.STRING(255) }, { transaction })
      await queryInterface.addColumn(interviewsTable, 'reschedule_url', { type: Sequelize.STRING(255) }, { transaction })
      await queryInterface.addColumn(interviewsTable, 'title', { type: Sequelize.STRING(255) }, { transaction })
      await queryInterface.addColumn(interviewsTable, 'host_name', { type: Sequelize.STRING(255) }, { transaction })
      await queryInterface.addColumn(interviewsTable, 'host_email', { type: Sequelize.STRING(255) }, { transaction })
      await queryInterface.addColumn(interviewsTable, 'guest_names', { type: Sequelize.ARRAY(Sequelize.STRING) }, { transaction })
      await queryInterface.addColumn(interviewsTable, 'guest_emails', { type: Sequelize.ARRAY(Sequelize.STRING) }, { transaction })


      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  }
}
