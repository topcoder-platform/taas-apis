/**
 * Sync the database models to db tables.
 */
const config = require('config')
const models = require('./models')
const logger = require('./common/logger')

const initDB = async () => {
  await models.sequelize.dropSchema(config.DB_SCHEMA_NAME)
  await models.sequelize.createSchema(config.DB_SCHEMA_NAME)
  await models.sequelize.sync({ force: true })
}

if (!module.parent) {
  initDB().then(() => {
    logger.info('Database synced successfully')
    process.exit()
  }).catch((e) => {
    logger.logFullError(e)
    process.exit(1)
  })
}

module.exports = {
  initDB
}
