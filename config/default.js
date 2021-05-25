require('dotenv').config()
module.exports = {
  // the log level, default is 'debug'
  LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
  // the server port, default is 3000
  PORT: process.env.PORT || 3000,
  // the server api base path
  BASE_PATH: process.env.BASE_PATH || '/api/v5',

  // The authorization secret used during token verification.
  AUTH_SECRET: process.env.AUTH_SECRET || 'mysecret',
  // The valid issuer of tokens, a json array contains valid issuer.
  VALID_ISSUERS: process.env.VALID_ISSUERS || '["https://api.topcoder-dev.com", "https://api.topcoder.com", "https://topcoder-dev.auth0.com/", "https://auth.topcoder-dev.com/"]',
  // Auth0 URL, used to get TC M2M token
  AUTH0_URL: process.env.AUTH0_URL,
  // Auth0 audience, used to get TC M2M token
  AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE,
  // Auth0 audience for U-Bahn
  AUTH0_AUDIENCE_UBAHN: process.env.AUTH0_AUDIENCE_UBAHN,
  // Auth0 token cache time, used to get TC M2M token
  TOKEN_CACHE_TIME: process.env.TOKEN_CACHE_TIME,
  // Auth0 client id, used to get TC M2M token
  AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
  // Auth0 client secret, used to get TC M2M token
  AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET,
  // Proxy Auth0 URL, used to get TC M2M token
  AUTH0_PROXY_SERVER_URL: process.env.AUTH0_PROXY_SERVER_URL,

  m2m: {
    M2M_AUDIT_USER_ID: process.env.M2M_AUDIT_USER_ID || '00000000-0000-0000-0000-000000000000',
    M2M_AUDIT_HANDLE: process.env.M2M_AUDIT_HANDLE || 'TopcoderService'
  },

  // the Topcoder v5 url
  TC_API: process.env.TC_API || 'https://api.topcoder-dev.com/v5',
  // the organization id
  ORG_ID: process.env.ORG_ID || '36ed815b-3da1-49f1-a043-aaed0a4e81ad',
  // the referenced skill provider id
  TOPCODER_SKILL_PROVIDER_ID: process.env.TOPCODER_SKILL_PROVIDER_ID || '9cc0795a-6e12-4c84-9744-15858dba1861',

  TOPCODER_USERS_API: process.env.TOPCODER_USERS_API || 'https://api.topcoder-dev.com/v3/users',
  // the api to find topcoder members
  TOPCODER_MEMBERS_API: process.env.TOPCODER_MEMBERS_API || 'https://api.topcoder-dev.com/v3/members',
  // rate limit of requests to user api
  MAX_PARALLEL_REQUEST_TOPCODER_USERS_API: process.env.MAX_PARALLEL_REQUEST_TOPCODER_USERS_API || 100,

  // PostgreSQL database url.
  DATABASE_URL: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres',
  // string - PostgreSQL database target schema
  DB_SCHEMA_NAME: process.env.DB_SCHEMA_NAME || 'bookings',
  // the project service url
  PROJECT_API_URL: process.env.PROJECT_API_URL || 'https://api.topcoder-dev.com',

  // the default path for importing and exporting data
  DEFAULT_DATA_FILE_PATH: './data/demo-data.json',

  esConfig: {
    // the elasticsearch host
    HOST: process.env.ES_HOST || 'http://localhost:9200',

    ELASTICCLOUD: {
      // The elastic cloud id, if your elasticsearch instance is hosted on elastic cloud. DO NOT provide a value for ES_HOST if you are using this
      id: process.env.ELASTICCLOUD_ID,
      // The elastic cloud username for basic authentication. Provide this only if your elasticsearch instance is hosted on elastic cloud
      username: process.env.ELASTICCLOUD_USERNAME,
      // The elastic cloud password for basic authentication. Provide this only if your elasticsearch instance is hosted on elastic cloud
      password: process.env.ELASTICCLOUD_PASSWORD
    },

    // The Amazon region to use when using AWS Elasticsearch service
    AWS_REGION: process.env.AWS_REGION || 'us-east-1', // AWS Region to be used if we use AWS ES

    // the job index
    ES_INDEX_JOB: process.env.ES_INDEX_JOB || 'job',
    // the job candidate index
    ES_INDEX_JOB_CANDIDATE: process.env.ES_INDEX_JOB_CANDIDATE || 'job_candidate',
    // the resource booking index
    ES_INDEX_RESOURCE_BOOKING: process.env.ES_INDEX_RESOURCE_BOOKING || 'resource_booking',

    // the max bulk size in MB for ES indexing
    MAX_BULK_REQUEST_SIZE_MB: process.env.MAX_BULK_REQUEST_SIZE_MB || 20,
    // the max number of documents per bulk for ES indexing
    MAX_BULK_NUM_DOCUMENTS: process.env.MAX_BULK_NUM_DOCUMENTS || 100
  },

  // Topcoder Bus API URL
  BUSAPI_URL: process.env.BUSAPI_URL || 'https://api.topcoder-dev.com/v5',
  // The error topic at which bus api will publish any errors
  KAFKA_ERROR_TOPIC: process.env.KAFKA_ERROR_TOPIC || 'common.error.reporting',
  // The originator value for the kafka messages
  KAFKA_MESSAGE_ORIGINATOR: process.env.KAFKA_MESSAGE_ORIGINATOR || 'taas-api',
  // topics for job service
  // the create job entity Kafka message topic
  TAAS_JOB_CREATE_TOPIC: process.env.TAAS_JOB_CREATE_TOPIC || 'taas.job.create',
  // the update job entity Kafka message topic
  TAAS_JOB_UPDATE_TOPIC: process.env.TAAS_JOB_UPDATE_TOPIC || 'taas.job.update',
  // the delete job entity Kafka message topic
  TAAS_JOB_DELETE_TOPIC: process.env.TAAS_JOB_DELETE_TOPIC || 'taas.job.delete',
  // topics for role service
  // the create role entity Kafka message topic
  TAAS_ROLE_CREATE_TOPIC: process.env.TAAS_ROLE_CREATE_TOPIC || 'taas.role.create',
  // the update role entity Kafka message topic
  TAAS_ROLE_UPDATE_TOPIC: process.env.TAAS_ROLE_UPDATE_TOPIC || 'taas.role.update',
  // the delete role entity Kafka message topic
  TAAS_ROLE_DELETE_TOPIC: process.env.TAAS_ROLE_DELETE_TOPIC || 'taas.role.delete',
  // topics for jobcandidate service
  // the create job candidate entity Kafka message topic
  TAAS_JOB_CANDIDATE_CREATE_TOPIC: process.env.TAAS_JOB_CANDIDATE_CREATE_TOPIC || 'taas.jobcandidate.create',
  // the update job candidate entity Kafka message topic
  TAAS_JOB_CANDIDATE_UPDATE_TOPIC: process.env.TAAS_JOB_CANDIDATE_UPDATE_TOPIC || 'taas.jobcandidate.update',
  // the delete job candidate entity Kafka message topic
  TAAS_JOB_CANDIDATE_DELETE_TOPIC: process.env.TAAS_JOB_CANDIDATE_DELETE_TOPIC || 'taas.jobcandidate.delete',
  // topics for resource booking service
  // the create resource booking entity Kafka message topic
  TAAS_RESOURCE_BOOKING_CREATE_TOPIC: process.env.TAAS_RESOURCE_BOOKING_CREATE_TOPIC || 'taas.resourcebooking.create',
  // the update resource booking entity Kafka message topic
  TAAS_RESOURCE_BOOKING_UPDATE_TOPIC: process.env.TAAS_RESOURCE_BOOKING_UPDATE_TOPIC || 'taas.resourcebooking.update',
  // the delete resource booking entity Kafka message topic
  TAAS_RESOURCE_BOOKING_DELETE_TOPIC: process.env.TAAS_RESOURCE_BOOKING_DELETE_TOPIC || 'taas.resourcebooking.delete',
  // topics for work period service
  // the create work period entity Kafka message topic
  TAAS_WORK_PERIOD_CREATE_TOPIC: process.env.TAAS_WORK_PERIOD_CREATE_TOPIC || 'taas.workperiod.create',
  // the update work period entity Kafka message topic
  TAAS_WORK_PERIOD_UPDATE_TOPIC: process.env.TAAS_WORK_PERIOD_UPDATE_TOPIC || 'taas.workperiod.update',
  // the delete work period entity Kafka message topic
  TAAS_WORK_PERIOD_DELETE_TOPIC: process.env.TAAS_WORK_PERIOD_DELETE_TOPIC || 'taas.workperiod.delete',
  // topics for work period payment service
  // the create work period payment entity Kafka message topic
  TAAS_WORK_PERIOD_PAYMENT_CREATE_TOPIC: process.env.TAAS_WORK_PERIOD_PAYMENT_CREATE_TOPIC || 'taas.workperiodpayment.create',
  // the update work period payment entity Kafka message topic
  TAAS_WORK_PERIOD_PAYMENT_UPDATE_TOPIC: process.env.TAAS_WORK_PERIOD_PAYMENT_UPDATE_TOPIC || 'taas.workperiodpayment.update',
  // the delete work period payment entity Kafka message topic
  TAAS_WORK_PERIOD_PAYMENT_DELETE_TOPIC: process.env.TAAS_WORK_PERIOD_PAYMENT_DELETE_TOPIC || 'taas.workperiodpayment.delete',
  // topics for interview service
  // the request interview Kafka message topic
  TAAS_INTERVIEW_REQUEST_TOPIC: process.env.TAAS_INTERVIEW_REQUEST_TOPIC || 'taas.interview.requested',
  // the interview update Kafka message topic
  TAAS_INTERVIEW_UPDATE_TOPIC: process.env.TAAS_INTERVIEW_UPDATE_TOPIC || 'taas.interview.update',
  // the interview bulk update Kafka message topic
  TAAS_INTERVIEW_BULK_UPDATE_TOPIC: process.env.TAAS_INTERVIEW_BULK_UPDATE_TOPIC || 'taas.interview.bulkUpdate',

  // the Kafka message topic for sending email
  EMAIL_TOPIC: process.env.EMAIL_TOPIC || 'external.action.email',
  // the emails address for receiving the issue report
  // REPORT_ISSUE_EMAILS may contain comma-separated list of email which is converted to array
  REPORT_ISSUE_EMAILS: (process.env.REPORT_ISSUE_EMAILS || '').split(','),
  // the emails address for receiving the issue report
  // REPORT_ISSUE_EMAILS may contain comma-separated list of email which is converted to array
  REQUEST_EXTENSION_EMAILS: (process.env.REQUEST_EXTENSION_EMAILS || '').split(','),
  // the emails address for interview invitation
  // INTERVIEW_INVITATION_CC_LIST may contain comma-separated list of email which is converted to array
  INTERVIEW_INVITATION_CC_LIST: (process.env.INTERVIEW_INVITATION_CC_LIST || '').split(','),
  // INTERVIEW_INVITATION_RECIPIENTS_LIST may contain comma-separated list of email which is converted to array
  // scheduler@x.ai should be in the RECIPIENTS list
  INTERVIEW_INVITATION_RECIPIENTS_LIST: (process.env.INTERVIEW_INVITATION_RECIPIENTS_LIST || 'scheduler@topcoder.com').split(','),
  // SendGrid email template ID for reporting issue
  REPORT_ISSUE_SENDGRID_TEMPLATE_ID: process.env.REPORT_ISSUE_SENDGRID_TEMPLATE_ID,
  // SendGrid email template ID for requesting extension
  REQUEST_EXTENSION_SENDGRID_TEMPLATE_ID: process.env.REQUEST_EXTENSION_SENDGRID_TEMPLATE_ID,
  // SendGrid email template ID for interview invitation
  INTERVIEW_INVITATION_SENDGRID_TEMPLATE_ID: process.env.INTERVIEW_INVITATION_SENDGRID_TEMPLATE_ID,
  // The sender (aka `from`) email for invitation.
  INTERVIEW_INVITATION_SENDER_EMAIL: process.env.INTERVIEW_INVITATION_SENDER_EMAIL || 'talent@topcoder.com',
  // the URL where TaaS App is hosted
  TAAS_APP_URL: process.env.TAAS_APP_URL || 'https://platform.topcoder-dev.com/taas/myteams',
  // environment variables for Payment Service
  ROLE_ID_SUBMITTER: process.env.ROLE_ID_SUBMITTER || '732339e7-8e30-49d7-9198-cccf9451e221',
  TYPE_ID_TASK: process.env.TYPE_ID_TASK || 'ecd58c69-238f-43a4-a4bb-d172719b9f31',
  DEFAULT_TIMELINE_TEMPLATE_ID: process.env.DEFAULT_TIMELINE_TEMPLATE_ID || '53a307ce-b4b3-4d6f-b9a1-3741a58f77e6',
  DEFAULT_TRACK_ID: process.env.DEFAULT_TRACK_ID || '9b6fc876-f4d9-4ccb-9dfd-419247628825',

  PAYMENT_PROCESSING_SWITCH: process.env.PAYMENT_PROCESSING_SWITCH || 'OFF'
}
