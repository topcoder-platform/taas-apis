require('dotenv').config()
module.exports = {
  LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
  PORT: process.env.PORT || 3000,
  BASE_PATH: process.env.BASE_PATH || '/api/v5',

  AUTH_SECRET: process.env.AUTH_SECRET || 'mysecret',
  VALID_ISSUERS: process.env.VALID_ISSUERS || '["https://api.topcoder-dev.com", "https://api.topcoder.com", "https://topcoder-dev.auth0.com/", "https://auth.topcoder-dev.com/"]',
  AUTH0_URL: process.env.AUTH0_URL,
  AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE,
  AUTH0_AUDIENCE_FOR_BUS_API: process.env.AUTH0_AUDIENCE_FOR_BUS_API,
  TOKEN_CACHE_TIME: process.env.TOKEN_CACHE_TIME,
  AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
  AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET,
  AUTH0_PROXY_SERVER_URL: process.env.AUTH0_PROXY_SERVER_URL,

  m2m: {
    M2M_AUDIT_USER_ID: process.env.M2M_AUDIT_USER_ID || '00000000-0000-0000-0000-000000000000',
    M2M_AUDIT_HANDLE: process.env.M2M_AUDIT_HANDLE || 'TopcoderService'
  },

  TC_API: process.env.TC_API || 'https://api.topcoder-dev.com/v5',
  ORG_ID: process.env.ORG_ID || '36ed815b-3da1-49f1-a043-aaed0a4e81ad',
  TOPCODER_SKILL_PROVIDER_ID: process.env.TOPCODER_SKILL_PROVIDER_ID || '9cc0795a-6e12-4c84-9744-15858dba1861',

  TOPCODER_USERS_API: process.env.TOPCODER_USERS_API || 'https://api.topcoder-dev.com/v3/users',

  DATABASE_URL: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres',
  DB_SCHEMA_NAME: process.env.DB_SCHEMA_NAME || 'bookings',
  PROJECT_API_URL: process.env.PROJECT_API_URL || 'https://api.topcoder-dev.com',

  esConfig: {
    HOST: process.env.ES_HOST || 'http://localhost:9200',

    ELASTICCLOUD: {
      id: process.env.ELASTICCLOUD_ID,
      username: process.env.ELASTICCLOUD_USERNAME,
      password: process.env.ELASTICCLOUD_PASSWORD
    },

    AWS_REGION: process.env.AWS_REGION || 'us-east-1', // AWS Region to be used if we use AWS ES

    ES_INDEX_JOB: process.env.ES_INDEX_JOB || 'job',
    ES_INDEX_JOB_CANDIDATE: process.env.ES_INDEX_JOB_CANDIDATE || 'job_candidate',
    ES_INDEX_RESOURCE_BOOKING: process.env.ES_INDEX_RESOURCE_BOOKING || 'resource_booking'
  },

  BUSAPI_URL: process.env.BUSAPI_URL || 'https://api.topcoder-dev.com/v5',
  KAFKA_ERROR_TOPIC: process.env.KAFKA_ERROR_TOPIC || 'common.error.reporting',
  KAFKA_MESSAGE_ORIGINATOR: process.env.KAFKA_MESSAGE_ORIGINATOR || 'taas-api',
  // topics for job service
  TAAS_JOB_CREATE_TOPIC: process.env.TAAS_JOB_CREATE_TOPIC || 'taas.job.create',
  TAAS_JOB_UPDATE_TOPIC: process.env.TAAS_JOB_UPDATE_TOPIC || 'taas.job.update',
  TAAS_JOB_DELETE_TOPIC: process.env.TAAS_JOB_DELETE_TOPIC || 'taas.job.delete',
  // topics for jobcandidate service
  TAAS_JOB_CANDIDATE_CREATE_TOPIC: process.env.TAAS_JOB_CANDIDATE_CREATE_TOPIC || 'taas.jobcandidate.create',
  TAAS_JOB_CANDIDATE_UPDATE_TOPIC: process.env.TAAS_JOB_CANDIDATE_UPDATE_TOPIC || 'taas.jobcandidate.update',
  TAAS_JOB_CANDIDATE_DELETE_TOPIC: process.env.TAAS_JOB_CANDIDATE_DELETE_TOPIC || 'taas.jobcandidate.delete',
  // topics for job service
  TAAS_RESOURCE_BOOKING_CREATE_TOPIC: process.env.TAAS_RESOURCE_BOOKING_CREATE_TOPIC || 'taas.resourcebooking.create',
  TAAS_RESOURCE_BOOKING_UPDATE_TOPIC: process.env.TAAS_RESOURCE_BOOKING_UPDATE_TOPIC || 'taas.resourcebooking.update',
  TAAS_RESOURCE_BOOKING_DELETE_TOPIC: process.env.TAAS_RESOURCE_BOOKING_DELETE_TOPIC || 'taas.resourcebooking.delete'
}
