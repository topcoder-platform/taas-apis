'use strict';
const config = require('config')

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const interviewsTable = { tableName: 'interviews', schema: config.DB_SCHEMA_NAME }
    const jobCandidatesTable = { tableName: 'job_candidates', schema: config.DB_SCHEMA_NAME }
    const transaction = await queryInterface.sequelize.transaction()

    try {
      // log which Job Candidates in "interview" status would become "open" to be aware
      const jobCandidatesWithInterview = await queryInterface.sequelize.query(`SELECT id FROM bookings.job_candidates WHERE status = 'interview';`)
      const jobCandidateIds = jobCandidatesWithInterview[0].map(jc => jc.id)
      console.log(`NOTE: Job Candidates in "interview" status which would become "open" for interview again, total: ${jobCandidateIds.length}, ids: ${jobCandidateIds.join(', ')}`)

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

      // add new columns nylas_event_id & nylas_event_edit_hash
      await queryInterface.addColumn(interviewsTable, 'nylas_event_id',
        { type: Sequelize.STRING(255), allowNull: true, defaultValue: null },
        { transaction })
      await queryInterface.addColumn(interviewsTable, 'nylas_event_edit_hash',
        { type: Sequelize.STRING(255), allowNull: true, defaultValue: null },
        { transaction })

      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  },
  down: async (queryInterface, Sequelize) => {
    const interviewsTable = { tableName: 'interviews', schema: config.DB_SCHEMA_NAME }
    const transaction = await queryInterface.sequelize.transaction()

    try {
      await queryInterface.removeColumn(interviewsTable, 'nylas_event_id', { transaction })
      await queryInterface.removeColumn(interviewsTable, 'nylas_event_edit_hash', { transaction })

      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  }
};
