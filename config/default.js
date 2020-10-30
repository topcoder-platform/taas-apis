require('dotenv').config()
module.exports = {
  LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
  PORT: process.env.PORT || 3000,
  BASE_PATH: process.env.BASE_PATH || '/api/v5',

  AUTH_SECRET: process.env.AUTH_SECRET || 'mysecret',
  VALID_ISSUERS: process.env.VALID_ISSUERS || '["https://api.topcoder-dev.com", "https://api.topcoder.com", "https://topcoder-dev.auth0.com/", "https://auth.topcoder-dev.com/"]',
  AUTH0_URL: process.env.AUTH0_URL,
  AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE,
  TOKEN_CACHE_TIME: process.env.TOKEN_CACHE_TIME,
  AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
  AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET,
  AUTH0_PROXY_SERVER_URL: process.env.AUTH0_PROXY_SERVER_URL,

  TC_API: process.env.TC_API || 'https://api.topcoder-dev.com/v5',
  ORG_ID: process.env.ORG_ID || '36ed815b-3da1-49f1-a043-aaed0a4e81ad',

  DATABASE_URL: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres',
  DB_SCHEMA_NAME: process.env.DB_SCHEMA_NAME || 'bookings',
  PROJECT_API_URL: process.env.PROJECT_API_URL || 'https://api.topcoder-dev.com',

  esConfig: {
    HOST: process.env.ES_HOST || 'http://localhost:9200',
    ES_INDEX_JOB: process.env.ES_INDEX_JOB || 'job',
    ES_INDEX_JOB_CANDIDATE: process.env.ES_INDEX_JOB_CANDIDATE || 'job_candidate',
    ES_INDEX_RESOURCE_BOOKING: process.env.ES_INDEX_RESOURCE_BOOKING || 'resource_booking'
  }
}
