const config = require('config')

/*
 * Add externalId and resume fields to the JobCandidate model.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.addColumn({ tableName: 'job_candidates', schema: config.DB_SCHEMA_NAME }, 'external_id',
        { type: Sequelize.STRING(255) },
        { transaction })
      await queryInterface.addColumn({ tableName: 'job_candidates', schema: config.DB_SCHEMA_NAME }, 'resume',
        { type: Sequelize.STRING(2048) },
        { transaction })
      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  },
  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.removeColumn({ tableName: 'job_candidates', schema: config.DB_SCHEMA_NAME }, 'resume',
        { transaction })
      await queryInterface.removeColumn({ tableName: 'job_candidates', schema: config.DB_SCHEMA_NAME }, 'external_id',
        { transaction })
      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  }
}
