/*
 * Configuration for the RCRM import script.
 * Namespace is created to allow to configure the env variables for this script independently.
 */

const config = require('config')

const namespace = process.env.RCRM_IMPORT_CONFIG_NAMESAPCE || 'RCRM_IMPORT_'

module.exports = {
  SLEEP_TIME: process.env[`${namespace}SLEEP_TIME`] || 500,
  TAAS_API_URL: process.env[`${namespace}TAAS_API_URL`] || config.TC_API,

  TC_API: process.env[`${namespace}TC_API`] || config.TC_API,
  AUTH0_URL: process.env[`${namespace}AUTH0_URL`] || config.AUTH0_URL,
  AUTH0_AUDIENCE: process.env[`${namespace}AUTH0_AUDIENCE`] || config.AUTH0_AUDIENCE,
  TOKEN_CACHE_TIME: process.env[`${namespace}TOKEN_CACHE_TIME`] || config.TOKEN_CACHE_TIME,
  AUTH0_CLIENT_ID: process.env[`${namespace}AUTH0_CLIENT_ID`] || config.AUTH0_CLIENT_ID,
  AUTH0_CLIENT_SECRET: process.env[`${namespace}AUTH0_CLIENT_SECRET`] || config.AUTH0_CLIENT_SECRET,
  AUTH0_PROXY_SERVER_URL: process.env[`${namespace}AUTH0_PROXY_SERVER_URL`] || config.AUTH0_PROXY_SERVER_URL
}
