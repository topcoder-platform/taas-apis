module.exports = {
  LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
  PORT: process.env.PORT || 3000,
  BASE_PATH: process.env.BASE_PATH || '/api/v5',

  AUTH_SECRET: process.env.AUTH_SECRET || 'mysecret',
  VALID_ISSUERS: process.env.VALID_ISSUERS || '["https://api.topcoder-dev.com", "https://api.topcoder.com", "https://topcoder-dev.auth0.com/", "https://auth.topcoder-dev.com/"]',
  AUTH0_URL: process.env.AUTH0_URL || 'https://topcoder-dev.auth0.com/oauth/token',
  AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE || 'https://u-bahn.topcoder.com',
  TOKEN_CACHE_TIME: process.env.TOKEN_CACHE_TIME || 90,
  AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID || 'LEyCiuOrHc7UAFoY0EAAhMulWSX7SrQ5',
  AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET || 'Q1sQ77w43F5pWsMguK9JsStQwoGNRAD6IN4nyUShzlf24w6-CXD0ubDDT79t28tQ',
  AUTH0_PROXY_SERVER_URL: process.env.AUTH0_PROXY_SERVER_URL || 'https://auth0proxy.topcoder-dev.com/token',

  TC_API: process.env.TC_API || 'https://api.topcoder-dev.com/v5',
  ORG_ID: process.env.ORG_ID || '36ed815b-3da1-49f1-a043-aaed0a4e81ad',

  POSTGRES_URL: process.env.POSTGRES_URL || 'postgres://postgres:postgres@localhost:5432/postgres',
  DB_SCHEMA_NAME: process.env.DB_SCHEMA_NAME || 'bookings',
  PROJECT_API_URL: process.env.PROJECT_API_URL || 'http://localhost:4000',

  esConfig: {
    HOST: process.env.ES_HOST || 'http://localhost:9200',
    ES_INDEX_JOB: process.env.ES_INDEX_JOB || 'job',
    ES_INDEX_JOB_CANDIDATE: process.env.ES_INDEX_JOB_CANDIDATE || 'job_candidate',
    ES_INDEX_RESOURCE_BOOKING: process.env.ES_INDEX_RESOURCE_BOOKING || 'resource_booking'
  }
}
