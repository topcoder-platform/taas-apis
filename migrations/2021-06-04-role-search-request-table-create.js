const config = require('config')

/*
 * Create role table
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('role_search_requests', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4
      },
      memberId: {
        field: 'member_id',
        type: Sequelize.UUID
      },
      previousRoleSearchRequestId: {
        field: 'previous_role_search_request_id',
        type: Sequelize.UUID
      },
      roleId: {
        field: 'role_id',
        type: Sequelize.UUID,
        references: {
          model: {
            tableName: 'roles',
            schema: config.DB_SCHEMA_NAME
          },
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      jobDescription: {
        field: 'job_description',
        type: Sequelize.STRING()
      },
      skills: {
        type: Sequelize.ARRAY({
          type: Sequelize.UUID
        })
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
    }, {
      schema: config.DB_SCHEMA_NAME
    })
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable({
      tableName: 'role_search_requests',
      schema: config.DB_SCHEMA_NAME
    })
  }
}
