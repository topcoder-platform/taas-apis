/**
 * Sync the database models to db tables.
 */
const config = require('config')
const fs = require('fs')
const models = require('./models')
const logger = require('./common/logger')

// the directory at which migration scripts are located
const MigrationsDirPath = './migrations'

/**
 * List the filenames of the migration files.
 *
 * @returns {Array} the list of filenames
 */
function listMigrationFiles () {
  const filenames = fs.readdirSync(MigrationsDirPath)
  return filenames
}

const initDB = async () => {
  if (process.argv[2] === 'force') {
    await models.sequelize.dropSchema(config.DB_SCHEMA_NAME)
  }
  await models.sequelize.createSchema(config.DB_SCHEMA_NAME)
  // define SequelizeMeta table
  const SequelizeMeta = await models.sequelize.define('SequelizeMeta', {
    name: {
      type: models.Sequelize.STRING(255),
      allowNull: false
    }
  }, { timestamps: false })
  // re-init all tables including the SequelizeMeta table
  await models.sequelize.sync({ force: true })
  // add filenames of existing migration scripts to the SequelizeMeta table
  await SequelizeMeta.bulkCreate(listMigrationFiles().map(filename => ({ name: filename })))
}

if (!module.parent) {
  initDB().then(() => {
    logger.info({ component: 'init-db', message: 'Database synced successfully' })
    process.exit()
  }).catch((e) => {
    logger.logFullError(e, { component: 'init-db' })
    process.exit(1)
  })
}

module.exports = {
  initDB
}
