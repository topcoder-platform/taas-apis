const config = require('config')

/*
 * Add min_salary, max_salary, hours_per_week, job_location, job_timezone and currency fields to the Job model.
 * Add remark field to the JobCandidate model.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.addColumn({ tableName: 'jobs', schema: config.DB_SCHEMA_NAME }, 'min_salary',
        { type: Sequelize.INTEGER, allowNull: false },
        { transaction })
      await queryInterface.addColumn({ tableName: 'jobs', schema: config.DB_SCHEMA_NAME }, 'max_salary',
        { type: Sequelize.INTEGER, allowNull: false },
        { transaction })
      await queryInterface.addColumn({ tableName: 'jobs', schema: config.DB_SCHEMA_NAME }, 'hours_per_week',
        { type: Sequelize.INTEGER, allowNull: false },
        { transaction })
      await queryInterface.addColumn({ tableName: 'jobs', schema: config.DB_SCHEMA_NAME }, 'job_location',
        { type: Sequelize.STRING(255), allowNull: false },
        { transaction })
      await queryInterface.addColumn({ tableName: 'jobs', schema: config.DB_SCHEMA_NAME }, 'job_timezone',
        { type: Sequelize.STRING(128), allowNull: false },
        { transaction })
      await queryInterface.addColumn({ tableName: 'jobs', schema: config.DB_SCHEMA_NAME }, 'currency',
        { type: Sequelize.STRING(30), allowNull: false },
        { transaction })
      await queryInterface.addColumn({ tableName: 'job_candidates', schema: config.DB_SCHEMA_NAME }, 'remark',
        { type: Sequelize.STRING(255) },
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
      await queryInterface.removeColumn({ tableName: 'jobs', schema: config.DB_SCHEMA_NAME }, 'min_salary', { transaction })
      await queryInterface.removeColumn({ tableName: 'jobs', schema: config.DB_SCHEMA_NAME }, 'max_salary', { transaction })
      await queryInterface.removeColumn({ tableName: 'jobs', schema: config.DB_SCHEMA_NAME }, 'hours_per_week', { transaction })
      await queryInterface.removeColumn({ tableName: 'jobs', schema: config.DB_SCHEMA_NAME }, 'job_location', { transaction })
      await queryInterface.removeColumn({ tableName: 'jobs', schema: config.DB_SCHEMA_NAME }, 'job_timezone', { transaction })
      await queryInterface.removeColumn({ tableName: 'jobs', schema: config.DB_SCHEMA_NAME }, 'currency', { transaction })
      await queryInterface.removeColumn({ tableName: 'job_candidates', schema: config.DB_SCHEMA_NAME }, 'remark', { transaction })
      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  }
}
