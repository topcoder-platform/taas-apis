/*
 *  surveymonkey api
 *
 */

const logger = require('./logger')
const config = require('config')
const _ = require('lodash')
const request = require('superagent')
const moment = require('moment')
const { encodeQueryString } = require('./helper')
/**
 * This code uses several environment variables
 *
 * WEEKLY_SURVEY_SURVEY_CONTACT_GROUP_ID - the ID of contacts list which would be used to store all the contacts,
 *                            see https://developer.surveymonkey.com/api/v3/#contact_lists-id
 * WEEKLY_SURVEY_SURVEY_MASTER_COLLECTOR_ID - the ID of master collector - this collector should be created manually,
 *                              and all other collectors would be created by copying this master collector.
 *                              This is needed so we can make some config inside master collector which would
 *                              be applied to all collectors.
 * WEEKLY_SURVEY_SURVEY_MASTER_MESSAGE_ID - the ID of master message - similar to collector, this message would be created manually
 *                            and then script would create copies of this message to use the same config.
 */

const localLogger = {
  debug: (message, context) => logger.debug({ component: 'SurveyMonkeyAPI', context, message }),
  error: (message, context) => logger.error({ component: 'SurveyMonkeyAPI', context, message }),
  info: (message, context) => logger.info({ component: 'SurveyMonkeyAPI', context, message })
}

function getRemainingRequestCountMessage (response) {
  return `today has sent ${response.header['x-ratelimit-app-global-day-limit'] - response.header['x-ratelimit-app-global-day-remaining']} requests`
}

function enrichErrorMessage (e) {
  e.code = _.get(e, 'response.body.error.http_status_code')
  e.message = _.get(e, 'response.body.error.message', e.toString())

  return e
}

function getSingleItem (lst, errorMessage) {
  if (lst.length === 0) {
    return null
  }

  if (lst.length > 1) {
    throw new Error(errorMessage)
  }

  return lst[0].id
}

/*
 * get collector name
 *
 * format `Week Ending yyyy-nth(weeks)`
 */
function getCollectorName (dt) {
  return 'Week Ending ' + moment(dt).format('M/D/YYYY')
}

/*
 *  search collector by name
 */
async function searchCollector (collectorName) {
  const url = `${config.WEEKLY_SURVEY.BASE_URL}/surveys/${config.WEEKLY_SURVEY.SURVEY_ID}/collectors?${encodeQueryString({ name: collectorName })}`
  try {
    const response = await request
      .get(url)
      .set('Authorization', `Bearer ${config.WEEKLY_SURVEY.JWT_TOKEN}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')

    localLogger.info(`URL ${url}, ${getRemainingRequestCountMessage(response)}`, 'searchCollector')

    return getSingleItem(response.body.data, 'More than 1 collector found by name ' + collectorName)
  } catch (e) {
    const enrichedError = enrichErrorMessage(e)
    localLogger.error(`URL ${url} ERROR ${enrichedError}, ${getRemainingRequestCountMessage(e.response)}`, 'searchCollector')
    throw enrichedError
  }
}

/*
 * create a named collector if not created
 * else return the collectId of the named collector
 */
async function createCollector (collectorName) {
  let collectorID = await searchCollector(collectorName)
  if (collectorID) {
    return collectorID
  }

  collectorID = await cloneCollector()
  await renameCollector(collectorID, collectorName)

  return collectorID
}

/*
 * clone collector from MASTER_COLLECTOR
 */
async function cloneCollector () {
  const body = { from_collector_id: `${config.WEEKLY_SURVEY.SURVEY_MASTER_COLLECTOR_ID}` }
  const url = `${config.WEEKLY_SURVEY.BASE_URL}/surveys/${config.WEEKLY_SURVEY.SURVEY_ID}/collectors`
  try {
    const response = await request
      .post(url)
      .set('Authorization', `Bearer ${config.WEEKLY_SURVEY.JWT_TOKEN}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .send(body)
    localLogger.info(`URL ${url}, ${getRemainingRequestCountMessage(response)}`, 'cloneCollector')
    return response.body.id
  } catch (e) {
    const enrichedError = enrichErrorMessage(e)
    localLogger.error(`URL ${url} ERROR ${enrichedError}, ${getRemainingRequestCountMessage(e.response)}`, 'cloneCollector')
    throw enrichedError
  }
}

/*
 * rename collector
 */
async function renameCollector (collectorId, name) {
  const body = { name: name }
  const url = `${config.WEEKLY_SURVEY.BASE_URL}/collectors/${collectorId}`
  try {
    const response = await request
      .patch(url)
      .set('Authorization', `Bearer ${config.WEEKLY_SURVEY.JWT_TOKEN}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .send(body)
    localLogger.info(`URL ${url}, ${getRemainingRequestCountMessage(response)}`, 'renameCollector')
  } catch (e) {
    const enrichedError = enrichErrorMessage(e)
    localLogger.error(`URL ${url} ERROR ${enrichedError}, ${getRemainingRequestCountMessage(e.response)}`, 'renameCollector')
    throw enrichedError
  }
}

/*
 * create message
 */
async function createMessage (collectorId) {
  const body = {
    from_collector_id: `${config.WEEKLY_SURVEY.SURVEY_MASTER_COLLECTOR_ID}`,
    from_message_id: `${config.WEEKLY_SURVEY.SURVEY_MASTER_MESSAGE_ID}`
  }
  const url = `${config.WEEKLY_SURVEY.BASE_URL}/collectors/${collectorId}/messages`
  try {
    const response = await request
      .post(url)
      .set('Authorization', `Bearer ${config.WEEKLY_SURVEY.JWT_TOKEN}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .send(body)
    localLogger.info(`URL ${url}, ${getRemainingRequestCountMessage(response)}`, 'createMessage')
    return response.body.id
  } catch (e) {
    const enrichedError = enrichErrorMessage(e)
    localLogger.error(`URL ${url} ERROR ${enrichedError}, ${getRemainingRequestCountMessage(e.response)}`, 'createMessage')
    throw enrichedError
  }
}

/**
 * Add Contact Email to List for sending a survey
 */
async function upsertContactInSurveyMonkey (list) {
  list = _.filter(list, p => p.email)
  if (!list.length) {
    return []
  }
  const body = {
    contacts: list
  }
  const url = `${config.WEEKLY_SURVEY.BASE_URL}/contact_lists/${config.WEEKLY_SURVEY.SURVEY_CONTACT_GROUP_ID}/contacts/bulk`
  try {
    const response = await request
      .post(url)
      .set('Authorization', `Bearer ${config.WEEKLY_SURVEY.JWT_TOKEN}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .send(body)

    localLogger.info(`URL ${url}, ${getRemainingRequestCountMessage(response)}`, 'upsertContactInSurveyMonkey')
    return _.concat(response.body.existing, response.body.succeeded)
  } catch (e) {
    const enrichedError = enrichErrorMessage(e)
    localLogger.error(`URL ${url} ERROR ${enrichedError}, ${getRemainingRequestCountMessage(e.response)}`, 'createMessage')
    throw enrichedError
  }
}

async function addContactsToSurvey (collectorId, messageId, contactIds) {
  const url = `${config.WEEKLY_SURVEY.BASE_URL}/collectors/${collectorId}/messages/${messageId}/recipients/bulk`
  const body = { contact_ids: _.map(contactIds, 'id') }
  try {
    const response = await request
      .post(url)
      .set('Authorization', `Bearer ${config.WEEKLY_SURVEY.JWT_TOKEN}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .send(body)
    localLogger.info(`URL ${url}, ${getRemainingRequestCountMessage(response)}`, 'addContactsToSurvey')
    return response.body.id
  } catch (e) {
    const enrichedError = enrichErrorMessage(e)
    localLogger.error(`URL ${url} ERROR ${enrichedError}, ${getRemainingRequestCountMessage(e.response)}`, 'addContactsToSurvey')
    throw enrichedError
  }
}

async function sendSurveyAPI (collectorId, messageId) {
  const url = `${config.WEEKLY_SURVEY.BASE_URL}/collectors/${collectorId}/messages/${messageId}/send`
  try {
    const response = await request
      .post(url)
      .set('Authorization', `Bearer ${config.WEEKLY_SURVEY.JWT_TOKEN}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .send({})
    localLogger.info(`URL ${url}, ${getRemainingRequestCountMessage(response)}`, 'sendSurveyAPI')
    return response.body.id
  } catch (e) {
    const enrichedError = enrichErrorMessage(e)
    localLogger.error(`URL ${url} ${enrichedError}, ${getRemainingRequestCountMessage(e.response)}`, 'sendSurveyAPI')
    throw enrichedError
  }
}

module.exports = {
  getCollectorName,
  createCollector,
  createMessage,
  upsertContactInSurveyMonkey,
  addContactsToSurvey,
  sendSurveyAPI
}
