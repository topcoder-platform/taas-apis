const { Sequelize, Model } = require('sequelize')
const config = require('config')
const errors = require('../common/errors')

module.exports = (sequelize) => {
  class Role extends Model {
    /**
     * Create association between models
     * @param {Object} models the database models
     */
    static associate (models) {
      Role._models = models
      Role.hasMany(models.RoleSearchRequest, { foreignKey: 'roleId' })
    }

    /**
     * Get role by id
     * @param {String} id the role id
     * @returns {Role} the role instance
     */
    static async findById (id) {
      const role = await Role.findOne({
        where: {
          id
        }
      })
      if (!role) {
        throw new errors.NotFoundError(`id: ${id} "Role" doesn't exists.`)
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
              type: Sequelize.SMALLINT
            },
            inCountry: {
              field: 'in_country',
              type: Sequelize.SMALLINT
            },
            offShore: {
              field: 'off_shore',
              type: Sequelize.SMALLINT
            },
            niche: {
              field: 'niche',
              type: Sequelize.SMALLINT
            },
            rate20Niche: {
              field: 'rate20_niche',
              type: Sequelize.SMALLINT
            },
            rate30Niche: {
              field: 'rate30_niche',
              type: Sequelize.SMALLINT
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
    },
    {
      schema: config.DB_SCHEMA_NAME,
      sequelize,
      tableName: 'roles',
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
      },
      indexes: [
        {
          unique: true,
          fields: ['name'],
          where: {
            deleted_at: null
          }
        }
      ]
    }
  )

  return Role
}
