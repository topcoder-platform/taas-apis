# Topcoder Bookings API

## Dependencies

- nodejs https://nodejs.org/en/ (v12+)
- PostgreSQL
- ElasticSearch (7.x)
- Docker
- Docker-Compose

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
- `AUTH0_AUDIENCE_UBAHN`: Auth0 audience for U-Bahn
- `TOKEN_CACHE_TIME`: Auth0 token cache time, used to get TC M2M token
- `AUTH0_CLIENT_ID`: Auth0 client id, used to get TC M2M token
- `AUTH0_CLIENT_SECRET`: Auth0 client secret, used to get TC M2M token
- `AUTH0_PROXY_SERVER_URL`: Proxy Auth0 URL, used to get TC M2M token

- `m2m.M2M_AUDIT_USER_ID`: default value is `00000000-0000-0000-0000-000000000000`
- `m2m.M2M_AUDIT_HANDLE`: default value is `TopcoderService`

- `DATABASE_URL`: PostgreSQL database url.
- `DB_SCHEMA_NAME`: string - PostgreSQL database target schema
- `PROJECT_API_URL`: the project service url
- `TC_API`: the Topcoder v5 url
- `ORG_ID`: the organization id
- `TOPCODER_SKILL_PROVIDER_ID`: the referenced skill provider id

- `esConfig.HOST`: the elasticsearch host
- `esConfig.ES_INDEX_JOB`: the job index
- `esConfig.ES_INDEX_JOB_CANDIDATE`: the job candidate index
- `esConfig.ES_INDEX_RESOURCE_BOOKING`: the resource booking index
- `esConfig.AWS_REGION`: The Amazon region to use when using AWS Elasticsearch service
- `esConfig.ELASTICCLOUD.id`: The elastic cloud id, if your elasticsearch instance is hosted on elastic cloud. DO NOT provide a value for ES_HOST if you are using this
- `esConfig.ELASTICCLOUD.username`: The elastic cloud username for basic authentication. Provide this only if your elasticsearch instance is hosted on elastic cloud
- `esConfig.ELASTICCLOUD.password`: The elastic cloud password for basic authentication. Provide this only if your elasticsearch instance is hosted on elastic cloud

- `BUSAPI_URL`: Topcoder Bus API URL
- `KAFKA_ERROR_TOPIC`: The error topic at which bus api will publish any errors
- `KAFKA_MESSAGE_ORIGINATOR`: The originator value for the kafka messages

- `TAAS_JOB_CREATE_TOPIC`: the create job entity Kafka message topic
- `TAAS_JOB_UPDATE_TOPIC`: the update job entity Kafka message topic
- `TAAS_JOB_DELETE_TOPIC`: the delete job entity Kafka message topic
- `TAAS_JOB_CANDIDATE_CREATE_TOPIC`: the create job candidate entity Kafka message topic
- `TAAS_JOB_CANDIDATE_UPDATE_TOPIC`: the update job candidate entity Kafka message topic
- `TAAS_JOB_CANDIDATE_DELETE_TOPIC`: the delete job candidate entity Kafka message topic
- `TAAS_RESOURCE_BOOKING_CREATE_TOPIC`: the create resource booking entity Kafka message topic
- `TAAS_RESOURCE_BOOKING_UPDATE_TOPIC`: the update resource booking entity Kafka message topic
- `TAAS_RESOURCE_BOOKING_DELETE_TOPIC`: the delete resource booking entity Kafka message topic


## PostgreSQL Database Setup
- Go to https://www.postgresql.org/ download and install the PostgreSQL.
- Modify `DATABASE_URL` under `config/default.js` to meet your environment.
- Run `npm run init-db` to create table(run `npm run init-db force` to force creating table)

## DB Migration
- `npm run migrate`: run any migration files which haven't run yet.
- `npm run migrate:undo`: revert most recent migration.

Configuration for migration is at `./config/config.json`.

The following parameters can be set in the config file or via env variables:

- `username`: set via env `DB_USERNAME`; datebase username
- `password`: set via env `DB_PASSWORD`; datebase password
- `database`: set via env `DB_NAME`; datebase name
- `host`: set via env `DB_HOST`; datebase host name

## ElasticSearch Setup
- Go to https://www.elastic.co/downloads/ download and install the elasticsearch.
- Modify `esConfig` under `config/default.js` to meet your environment.
- Run `npm run create-index` to create ES index.
- Run `npm run delete-index` to delete ES index.

## Local Deployment

- Install dependencies `npm install`
- Run lint `npm run lint`
- Run lint fix `npm run lint:fix`
- Clear and init db `npm run init-db force`
- Clear and create es index

    ``` bash
    npm run delete-index # run this if you already created index
    npm run create-index
    ```

- Start app `npm start`
- App is running at `http://localhost:3000`

## Local Deployment with Docker

Make sure all config values are right, and you can run on local successful, then run below commands

1. Navigate to the directory `docker`

2. Rename the file `sample.api.env` to `api.env`

3. Set the required AUTH0 configurations, PostgreSQL Database url and ElasticSearch host in the file `api.env`

    Note that you can also add other variables to `api.env`, with `<key>=<value>` format per line.
    If using AWS ES you should add `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` variables as well.

4. Once that is done, run the following command

    ```bash
    docker-compose up
    ```

5. When you are running the application for the first time, It will take some time initially to download the image and install the dependencies

## Testing
- Run `npm run test` to execute unit tests
- Run `npm run cov` to execute unit tests and generate coverage report.

## Verification
Refer to the verification document [Verification.md](Verification.md)
