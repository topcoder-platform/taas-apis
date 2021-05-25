
const { Sequelize, Model } = require('sequelize')
const config = require('config')
const errors = require('../common/errors')

module.exports = (sequelize) => {
  class Role extends Model {
    /**
     * Create association between models
     * @param {Object} models the database models
     */

    /**
     * Get Role by id
     * @param {String} id the Role id
     * @returns {Role} the Role instance
     */
    static async findById (id) {
      const criteria = {
        where: {
          id
        }
      }
      const role = await Role.findOne(criteria)
      if (!role) {
        throw new errors.NotFoundError(`id: ${id} "role" doesn't exists.`)
      }
      return role
    }
  }
  Role.init(
    {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT(1000)
      },
      skills: {
        type: Sequelize.ARRAY(Sequelize.STRING(50))
      },
      rates: {
        type: Sequelize.ARRAY(Sequelize.JSON), // Sequelize.ARRAY(Sequelize.INTEGER),
        allowNull: false
      },
      numMembers: {
        field: 'num_members',
        type: Sequelize.INTEGER
      },
      imageUrl: {
        field: 'image_url',
        type: Sequelize.STRING(255)
      },
      timeToCandidate: {
        field: 'time_to_candidate',
        type: Sequelize.SMALLINT
        // allowNull: false
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
    },
    {
      schema: config.DB_SCHEMA_NAME,
      sequelize,
      tableName: 'roles',
      paranoid: false,
      deletedAt: 'deletedAt',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      timestamps: true
    }
  )

  return Role
}
