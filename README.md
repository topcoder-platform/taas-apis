# Topcoder Bookings API

## Dependencies

- nodejs https://nodejs.org/en/ (v12+)
- Postgres

## Configuration

Configuration for the application is at `config/default.js`.
The following parameters can be set in config files or in env variables:

- `LOG_LEVEL`: the log level, default is 'debug'
- `PORT`: the server port, default is 3000
- `BASE_PATH`: the server api base path
- `AUTH_SECRET`: The authorization secret used during token verification.
- `VALID_ISSUERS`: The valid issuer of tokens, a json array contains valid issuer.
- `POSTGRES_URL`: Postgres database url.
- `DB_SCHEMA_NAME`: string - postgres database target schema
- `PROJECT_API_URL`: the project service url


## Postgres Database Setup
Go to https://www.postgresql.org/ download and install the Postgres.
Modify `POSTGRES_URL` under `config/default.js` to meet your environment.
Run `npm run init-db` to create table

## Local Deployment

- Install dependencies `npm install`
- Run lint `npm run lint`
- Run lint fix `npm run lint:fix`
- Clear and init db `npm run init-db`
- Start app `npm start`
- App is running at `http://localhost:3000`

## Testing
- Run mock-project-service app
- Run `npm run test` to execute unit tests
- Run `npm run cov` to execute unit tests and generate coverage report.

## Verification
Refer to the verification document [Verification.md](Verification.md)