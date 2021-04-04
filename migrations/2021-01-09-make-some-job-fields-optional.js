const config = require('config')

/*
 * Make Job fields externalId, description, startDate, endDate, resourceType, rateType and workload optional.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.changeColumn({ tableName: 'jobs', schema: config.DB_SCHEMA_NAME }, 'external_id',
        { type: Sequelize.STRING(255), allowNull: true },
        { transaction })
      await queryInterface.changeColumn({ tableName: 'jobs', schema: config.DB_SCHEMA_NAME }, 'description',
        { type: Sequelize.STRING(255), allowNull: true }
        , { transaction })
      await queryInterface.changeColumn({ tableName: 'jobs', schema: config.DB_SCHEMA_NAME }, 'start_date',
        { type: Sequelize.DATE, allowNull: true }
        , { transaction })
      await queryInterface.changeColumn({ tableName: 'jobs', schema: config.DB_SCHEMA_NAME }, 'end_date',
        { type: Sequelize.DATE, allowNull: true }
        , { transaction })
      await queryInterface.changeColumn({ tableName: 'jobs', schema: config.DB_SCHEMA_NAME }, 'resource_type',
        { type: Sequelize.STRING(255), allowNull: true }
        , { transaction })
      await queryInterface.changeColumn({ tableName: 'jobs', schema: config.DB_SCHEMA_NAME }, 'rate_type',
        { type: Sequelize.STRING(255), allowNull: true }
        , { transaction })
      await queryInterface.changeColumn({ tableName: 'jobs', schema: config.DB_SCHEMA_NAME }, 'workload',
        { type: Sequelize.STRING(45), allowNull: true }
        , { transaction })
      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  },
  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.changeColumn({ tableName: 'jobs', schema: config.DB_SCHEMA_NAME }, 'external_id',
        { type: Sequelize.STRING(255), allowNull: false },
        { transaction })
      await queryInterface.changeColumn({ tableName: 'jobs', schema: config.DB_SCHEMA_NAME }, 'description',
        { type: Sequelize.STRING(255), allowNull: false }
        , { transaction })
      await queryInterface.changeColumn({ tableName: 'jobs', schema: config.DB_SCHEMA_NAME }, 'start_date',
        { type: Sequelize.DATE, allowNull: false }
        , { transaction })
      await queryInterface.changeColumn({ tableName: 'jobs', schema: config.DB_SCHEMA_NAME }, 'end_date',
        { type: Sequelize.DATE, allowNull: false }
        , { transaction })
      await queryInterface.changeColumn({ tableName: 'jobs', schema: config.DB_SCHEMA_NAME }, 'resource_type',
        { type: Sequelize.STRING(255), allowNull: false }
        , { transaction })
      await queryInterface.changeColumn({ tableName: 'jobs', schema: config.DB_SCHEMA_NAME }, 'rate_type',
        { type: Sequelize.STRING(255), allowNull: false }
        , { transaction })
      await queryInterface.changeColumn({ tableName: 'jobs', schema: config.DB_SCHEMA_NAME }, 'workload',
        { type: Sequelize.STRING(45), allowNull: false }
        , { transaction })
      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  }
}
