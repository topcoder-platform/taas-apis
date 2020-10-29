# Topcoder Bookings API

## Dependencies

- nodejs https://nodejs.org/en/ (v12+)
- PostgreSQL
- ElasticSearch (7.x)

## Configuration

Configuration for the application is at `config/default.js`.

The following parameters can be set in config files or in env variables:

- `LOG_LEVEL`: the log level, default is 'debug'
- `PORT`: the server port, default is 3000
- `BASE_PATH`: the server api base path
- `AUTH_SECRET`: The authorization secret used during token verification.
- `VALID_ISSUERS`: The valid issuer of tokens, a json array contains valid issuer.
- `AUTH0_URL`: Auth0 URL, used to get TC M2M token
- `AUTH0_AUDIENCE`: Auth0 audience, used to get TC M2M token
- `TOKEN_CACHE_TIME`: Auth0 token cache time, used to get TC M2M token
- `AUTH0_CLIENT_ID`: Auth0 client id, used to get TC M2M token
- `AUTH0_CLIENT_SECRET`: Auth0 client secret, used to get TC M2M token
- `AUTH0_PROXY_SERVER_URL`: Proxy Auth0 URL, used to get TC M2M token
- `DATABASE_URL`: PostgreSQL database url.
- `DB_SCHEMA_NAME`: string - PostgreSQL database target schema
- `PROJECT_API_URL`: the project service url
- `TC_API`: the Topcoder v5 url
- `ORG_ID`: the organization id
- `HOST`: the elasticsearch host
- `ES_INDEX_JOB`: the job index
- `ES_INDEX_JOB_CANDIDATE`: the job candidate index
- `ES_INDEX_RESOURCE_BOOKING`: the resource booking index


## PostgreSQL Database Setup
- Go to https://www.postgresql.org/ download and install the PostgreSQL.
- Modify `DATABASE_URL` under `config/default.js` to meet your environment.
- Run `npm run init-db` to create table

## ElasticSearch Setup
- Go to https://www.elastic.co/downloads/ download and install the elasticsearch.
- Modify `esConfig` under `config/default.js` to meet your environment.
- Run `npm run create-index` to create ES index.
- Run `npm run delete-index` to delete ES index.

## Local Deployment

- Install dependencies `npm install`
- Run lint `npm run lint`
- Run lint fix `npm run lint:fix`
- Clear and init db `npm run init-db`
- Clear and create es index `npm run delete-index && npm run create-index`
- Start app `npm start`
- App is running at `http://localhost:3000`

## Testing
- Run `npm run test` to execute unit tests
- Run `npm run cov` to execute unit tests and generate coverage report.

## Verification
Refer to the verification document [Verification.md](Verification.md)