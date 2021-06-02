const config = require('config')

/*
 * Create role table
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.createTable('roles', {
        id: {
          type: Sequelize.UUID,
          primaryKey: true,
          allowNull: false,
          defaultValue: Sequelize.UUIDV4
        },
        name: {
          type: Sequelize.STRING(50),
          allowNull: false
        },
        description: {
          type: Sequelize.STRING(1000)
        },
        listOfSkills: {
          field: 'list_of_skills',
          type: Sequelize.ARRAY({
            type: Sequelize.STRING(50)
          })
        },
        rates: {
          type: Sequelize.ARRAY({
            type: Sequelize.JSONB({
              global: {
                type: Sequelize.SMALLINT,
                allowNull: false
              },
              inCountry: {
                field: 'in_country',
                type: Sequelize.SMALLINT,
                allowNull: false
              },
              offShore: {
                field: 'off_shore',
                type: Sequelize.SMALLINT,
                allowNull: false
              },
              rate30Global: {
                field: 'rate30_global',
                type: Sequelize.SMALLINT
              },
              rate30InCountry: {
                field: 'rate30_in_country',
                type: Sequelize.SMALLINT
              },
              rate30OffShore: {
                field: 'rate30_off_shore',
                type: Sequelize.SMALLINT
              },
              rate20Global: {
                field: 'rate20_global',
                type: Sequelize.SMALLINT
              },
              rate20InCountry: {
                field: 'rate20_in_country',
                type: Sequelize.SMALLINT
              },
              rate20OffShore: {
                field: 'rate20_off_shore',
                type: Sequelize.SMALLINT
              }
            }),
            allowNull: false
          }),
          allowNull: false
        },
        numberOfMembers: {
          field: 'number_of_members',
          type: Sequelize.NUMERIC
        },
        numberOfMembersAvailable: {
          field: 'number_of_members_available',
          type: Sequelize.SMALLINT
        },
        imageUrl: {
          field: 'image_url',
          type: Sequelize.STRING(255)
        },
        timeToCandidate: {
          field: 'time_to_candidate',
          type: Sequelize.SMALLINT
        },
        timeToInterview: {
          field: 'time_to_interview',
          type: Sequelize.SMALLINT
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
        schema: config.DB_SCHEMA_NAME,
        transaction
      })
      await queryInterface.addIndex(
        {
          tableName: 'roles',
          schema: config.DB_SCHEMA_NAME
        },
        ['name'],
        {
          type: 'UNIQUE',
          where: { deleted_at: null },
          transaction: transaction
        }
      )
      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable({
      tableName: 'roles',
      schema: config.DB_SCHEMA_NAME
    })
  }
}
