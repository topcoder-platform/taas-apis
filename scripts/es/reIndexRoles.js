/**
 * Reindex Roles data in Elasticsearch using data from database
 */
const config = require('config')
const logger = require('../../src/common/logger')
const helper = require('../../src/common/helper')

const roleId = helper.getParamFromCliArgs()
const index = config.get('esConfig.ES_INDEX_ROLE')
const reIndexAllRolesPrompt = `WARNING: this would remove existent data! Are you sure you want to reindex the index ${index}?`
const reIndexRolePrompt = `WARNING: this would remove existent data! Are you sure you want to reindex the document with id ${roleId} in index ${index}?`

async function reIndexRoles () {
  if (roleId === null) {
    await helper.promptUser(reIndexAllRolesPrompt, async () => {
      try {
        await helper.indexBulkDataToES('Role', index, logger)
        process.exit(0)
      } catch (err) {
        logger.logFullError(err, { component: 'reIndexRoles' })
        process.exit(1)
      }
    })
  } else {
    await helper.promptUser(reIndexRolePrompt, async () => {
      try {
        await helper.indexDataToEsById(roleId, 'Role', index, logger)
        process.exit(0)
      } catch (err) {
        logger.logFullError(err, { component: 'reIndexRoles' })
        process.exit(1)
      }
    })
  }
}

reIndexRoles()
