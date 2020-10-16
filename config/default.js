module.exports = {
  LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
  PORT: process.env.PORT || 3000,
  BASE_PATH: process.env.BASE_PATH || '/api/v5',

  AUTH_SECRET: process.env.AUTH_SECRET || 'mysecret',
  VALID_ISSUERS: process.env.VALID_ISSUERS || '["https://api.topcoder-dev.com", "https://api.topcoder.com", "https://topcoder-dev.auth0.com/"]',

  POSTGRES_URL: process.env.POSTGRES_URL || 'postgres://postgres:postgres@localhost:5432/postgres',
  DB_SCHEMA_NAME: process.env.DB_SCHEMA_NAME || 'bookings',
  PROJECT_API_URL: process.env.PROJECT_API_URL || 'http://localhost:4000'
}
