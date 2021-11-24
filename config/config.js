/*
 * Configuration for DB migration.
 */

module.exports = {
  development: {
    url: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres'
  },
  test: {
    url: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres'
  },
  production: {
    url: process.env.DATABASE_URL
  }
}
