const { Sequelize, Model } = require('sequelize')
const config = require('config')
const errors = require('../common/errors')

module.exports = (sequelize) => {
  class RoleSearchRequest extends Model {
    /**
     * Create association between models
     * @param {Object} models the database models
     */
    static associate (models) {
      RoleSearchRequest._models = models
      RoleSearchRequest.belongsTo(models.Role, {
        foreignKey: 'roleId'
      })
    }

    /**
     * Get RoleSearchRequest by id
     * @param {String} id the RoleSearchRequest id
     * @returns {RoleSearchRequest} the RoleSearchRequest instance
     */
    static async findById (id) {
      const roleSearchRequest = await RoleSearchRequest.findOne({
        where: {
          id
        }
      })
      if (!roleSearchRequest) {
        throw new errors.NotFoundError(`id: ${id} "RoleSearchRequest" doesn't exists.`)
      }
      return roleSearchRequest
    }
  }
  RoleSearchRequest.init(
    {
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
        allowNull: true
      },
      jobDescription: {
        field: 'job_description',
        type: Sequelize.STRING(100000)
      },
      skills: {
        type: Sequelize.ARRAY({
          type: Sequelize.UUID
        })
      },
      jobTitle: {
        field: 'job_title',
        type: Sequelize.STRING(100),
        allowNull: true
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
      tableName: 'role_search_requests',
      paranoid: true,
      deletedAt: 'deletedAt',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      timestamps: true,
      defaultScope: {
        attributes: {
          exclude: ['deletedAt']
        }
      },
      hooks: {
        afterCreate: (role) => {
          delete role.dataValues.deletedAt
        }
      }
    }
  )

  return RoleSearchRequest
}
