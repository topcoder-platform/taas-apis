const config = require('config')
const { v4: uuid } = require('uuid')

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert({ tableName: 'roles', schema: config.DB_SCHEMA_NAME }, [{
      id: uuid(),
      name: 'Custom',
      rates: [
        {
          "global": 1200,
          "off_shore": 1200,
          "in_country": 1200,
        }
      ],
      created_by: config.m2m.M2M_AUDIT_USER_ID,
      created_at: new Date()
    }], {}, { rates: { type: Sequelize.ARRAY({ type: Sequelize.JSONB() })}})
  },
  down: async (queryInterface) => {
    await queryInterface.bulkDelete({ tableName: 'roles', schema: config.DB_SCHEMA_NAME }, { name: 'Custom' })
  }
}