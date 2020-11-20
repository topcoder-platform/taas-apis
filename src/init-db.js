/**
 * Sync the database models to db tables.
 */
const config = require('config')
const models = require('./models')
const logger = require('./common/logger')

const initDB = async () => {
  if (process.argv[2] === 'force') {
    await models.sequelize.dropSchema(config.DB_SCHEMA_NAME)
  }
  await models.sequelize.createSchema(config.DB_SCHEMA_NAME)
  await models.sequelize.sync({ force: true })
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
