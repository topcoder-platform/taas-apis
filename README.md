# Topcoder TaaS API

## Tech Stack

- [Node.js](https://nodejs.org/) v12
- [PostgreSQL](https://www.postgresql.org/)
- [ElasticSearch](https://www.elastic.co/) v7.7
- [Apache Kafka](https://kafka.apache.org/)

## Local Setup

### Requirements

- [Node.js](https://nodejs.org/en/) v12+
- [Docker](https://www.docker.com/)
- [Docker-Compose](https://docs.docker.com/compose/install/)

### Steps to run locally

0. Make sure to use Node v12+ by command `node -v`. We recommend using [NVM](https://github.com/nvm-sh/nvm) to quickly switch to the right version:

   ```bash
   nvm use
   ```

1. 📦 Install npm dependencies

   ```bash
   npm install
   ```

2. ⚙ Local config

   1. In the `taas-apis` root directory create `.env` file with the next environment variables. Values for **Auth0 config** should be shared with you on the forum.<br>

      ```bash
      # Auth0 config
      AUTH0_URL=
      AUTH0_AUDIENCE=
      AUTH0_AUDIENCE_UBAHN=
      AUTH0_CLIENT_ID=
      AUTH0_CLIENT_SECRET=
      # If you would like to test Interview Workflow then Config Nylas as per ./docs/guides/Setup-Interview-Workflow-Locally.md
      NYLAS_CLIENT_ID=
      NYLAS_CLIENT_SECRET=
      NYLAS_SCHEDULER_WEBHOOK_BASE_URL=
      # Locally deployed services (via docker-compose)
      ES_HOST=http://dockerhost:9200
      DATABASE_URL=postgres://postgres:postgres@dockerhost:5432/postgres
      BUSAPI_URL=http://dockerhost:8002/v5
      TAAS_API_BASE_URL=http://localhost:3000/api/v5
      # stripe
      STRIPE_SECRET_KEY=
      CURRENCY=usd
      ```

      - Values from this file would be automatically used by many `npm` commands.
      - ⚠️ Never commit this file or its copy to the repository!

   2. Set `dockerhost` to point the IP address of Docker. Docker IP address depends on your system. For example if docker is run on IP `127.0.0.1` add a the next line to your `/etc/hosts` file:

      ```
      127.0.0.1       dockerhost
      ```

      Alternatively, you may update `.env` file and replace `dockerhost` with your docker IP address.

3. 🚢 Start docker-compose with services which are required to start Topcoder TaaS API locally

   ```bash
   npm run services:up
   ```

   Wait until all containers are fully started. As a good indicator, wait until `taas-es-processor` successfully started by viewing its logs:

   ```bash
   npm run services:logs -- -f taas-es-processor
   ```

   <details><summary>Click to see a good logs example</summary>
   <br>

   - first it would be waiting for `kafka-client` to create all the required topics and exit, you would see:

   ```
   tc-taas-es-processor  | Waiting for kafka-client to exit....
   ```

   - after that, `taas-es-processor` would be started itself. Make sure it successfully connected to Kafka, you should see 9 lines with text `Subscribed to taas.`:

   ```
   tc-taas-es-processor | [2021-04-09T21:20:19.035Z] app INFO : Starting kafka consumer
   tc-taas-es-processor | 2021-04-09T21:20:21.292Z INFO no-kafka-client Joined group taas-es-processor generationId 1 as no-kafka-client-076538fc-60dd-4ca4-a2b9-520bdf73bc9e
   tc-taas-es-processor | 2021-04-09T21:20:21.293Z INFO no-kafka-client Elected as group leader
   tc-taas-es-processor | 2021-04-09T21:20:21.449Z DEBUG no-kafka-client Subscribed to taas.role.update:0 offset 0 leader kafka:9093
   tc-taas-es-processor | 2021-04-09T21:20:21.450Z DEBUG no-kafka-client Subscribed to taas.role.delete:0 offset 0 leader kafka:9093
   tc-taas-es-processor | 2021-04-09T21:20:21.451Z DEBUG no-kafka-client Subscribed to taas.role.requested:0 offset 0 leader kafka:9093
   tc-taas-es-processor | 2021-04-09T21:20:21.452Z DEBUG no-kafka-client Subscribed to taas.jobcandidate.create:0 offset 0 leader kafka:9093
   tc-taas-es-processor | 2021-04-09T21:20:21.455Z DEBUG no-kafka-client Subscribed to taas.job.create:0 offset 0 leader kafka:9093
   tc-taas-es-processor | 2021-04-09T21:20:21.456Z DEBUG no-kafka-client Subscribed to taas.resourcebooking.delete:0 offset 0 leader kafka:9093
   tc-taas-es-processor | 2021-04-09T21:20:21.457Z DEBUG no-kafka-client Subscribed to taas.jobcandidate.delete:0 offset 0 leader kafka:9093
   tc-taas-es-processor | 2021-04-09T21:20:21.458Z DEBUG no-kafka-client Subscribed to taas.jobcandidate.update:0 offset 0 leader kafka:9093
   tc-taas-es-processor | 2021-04-09T21:20:21.459Z DEBUG no-kafka-client Subscribed to taas.resourcebooking.create:0 offset 0 leader kafka:9093
   tc-taas-es-processor | 2021-04-09T21:20:21.461Z DEBUG no-kafka-client Subscribed to taas.job.delete:0 offset 0 leader kafka:9093
   tc-taas-es-processor | 2021-04-09T21:20:21.463Z DEBUG no-kafka-client Subscribed to taas.workperiod.update:0 offset 0 leader kafka:9093
   tc-taas-es-processor | 2021-04-09T21:20:21.466Z DEBUG no-kafka-client Subscribed to taas.workperiod.delete:0 offset 0 leader kafka:9093
   tc-taas-es-processor | 2021-04-09T21:20:21.468Z DEBUG no-kafka-client Subscribed to taas.workperiod.create:0 offset 0 leader kafka:9093
   tc-taas-es-processor | 2021-04-09T21:20:21.469Z DEBUG no-kafka-client Subscribed to taas.workperiodpayment.update:0 offset 0 leader kafka:9093
   tc-taas-es-processor | 2021-04-09T21:20:21.470Z DEBUG no-kafka-client Subscribed to taas.workperiodpayment.delete:0 offset 0 leader kafka:9093
   tc-taas-es-processor | 2021-04-09T21:20:21.471Z DEBUG no-kafka-client Subscribed to taas.workperiodpayment.create:0 offset 0 leader kafka:9093
   tc-taas-es-processor | 2021-04-09T21:20:21.472Z DEBUG no-kafka-client Subscribed to taas.action.retry:0 offset 0 leader kafka:9093
   tc-taas-es-processor | 2021-04-09T21:20:21.473Z DEBUG no-kafka-client Subscribed to taas.job.update:0 offset 0 leader kafka:9093
   tc-taas-es-processor | 2021-04-09T21:20:21.474Z DEBUG no-kafka-client Subscribed to taas.resourcebooking.update:0 offset 0 leader kafka:9093
   tc-taas-es-processor | [2021-04-09T21:20:21.475Z] app INFO : Initialized.......
   tc-taas-es-processor | [2021-04-09T21:20:21.479Z] app INFO : common.error.reporting,taas.job.create,taas.job.update,taas.job.delete,taas.jobcandidate.create,taas.jobcandidate.update,taas.jobcandidate.delete,taas.resourcebooking.create,taas.resourcebooking.update,taas.resourcebooking.delete,taas.workperiod.create,taas.workperiod.update,taas.workperiod.delete,taas.workperiodpayment.create,taas.workperiodpayment.update,taas.interview.requested,taas.interview.update,taas.interview.bulkUpdate,taas.role.requested,taas.role.update,taas.role.delete,taas.action.retry
   tc-taas-es-processor | [2021-04-09T21:20:21.480Z] app INFO : Kick Start.......
   tc-taas-es-processor | ********** Topcoder Health Check DropIn listening on port 3001
   tc-taas-es-processor | Topcoder Health Check DropIn started and ready to roll
   ```

   </details>

   <br>
   If you want to learn more about docker-compose configuration
   <details><summary>see more details here</summary>
   <br>

   This docker-compose file starts the next services:
   | Service                                                                     |       Name        | Port  |
   | --------------------------------------------------------------------------- | :---------------: | :---: |
   | PostgreSQL                                                                  |     postgres      | 5432  |
   | Elasticsearch                                                               |   elasticsearch   | 9200  |
   | Zookeeper                                                                   |     zookeeper     | 2181  |
   | Kafka                                                                       |       kafka       | 9092  |
   | [tc-bus-api](https://github.com/topcoder-platform/tc-bus-api)               |    tc-bus-api     | 8002  |
   | [taas-es-processor](https://github.com/topcoder-platform/taas-es-processor) | taas-es-processor | 5000  |

   - as many of the Topcoder services in this docker-compose require Auth0 configuration for M2M calls, our docker-compose file passes environment variables `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_URL`, `AUTH0_AUDIENCE`, `AUTH0_PROXY_SERVER_URL` to its containers. docker-compose takes them from `.env` file if provided.

   - `docker-compose` automatically would create Kafka topics which are used by `taas-es-processor` listed in `local/kafka-client/topics.txt`.

   - To view the logs from any container inside docker-compose use the following command, replacing `SERVICE_NAME` with the corresponding value under the **Name** column in the above table:

     ```bash
     npm run services:log -- -f SERVICE_NAME
     ```

   - If you want to modify the code of any of the services which are run inside this docker-compose file, you can stop such service inside docker-compose by command `docker-compose -f local/docker-compose.yml stop <SERVICE_NAME>` and run the service separately, following its README file.

   </details>

   _NOTE: In production these dependencies / services are hosted & managed outside Topcoder TaaS API._

4. ♻ Init DB, ES

   ```bash
   npm run local:init
   ```

   This command will do 3 things:

   - create Database tables (drop if exists)
   - create Elasticsearch indexes (drop if exists)
   - import demo data to Database and index it to ElasticSearch (clears any existent data if exist)

5. 🚀 Start Topcoder TaaS API

   ```bash
   npm run dev
   ```

   Runs the Topcoder TaaS API using nodemon, so it would be restarted after any of the files is updated.
   The Topcoder TaaS API will be served on `http://localhost:3000`.

   - 💡 If you would like to test Interview Workflow locally, then follow the guide [How to Setup Interview Workflow Locally](./docs/guides/Setup-Interview-Workflow-Locally.md).

### Working on `taas-es-processor` locally

When you run `taas-apis` locally as per "[Steps to run locally](#steps-to-run-locally)" the [taas-es-processor](https://github.com/topcoder-platform/taas-es-processor) would be run for you automatically together with other services inside the docker container via `npm run services:up`.

To be able to change and test `taas-es-processor` locally you can follow the next steps:

1. Stop `taas-es-processor` inside docker by running `docker-compose -f local/docker-compose.yml stop taas-es-processor`
2. Run `taas-es-processor` separately from the source code. As `npm run services:up` already run all the dependencies for both `taas-apis` and for `taas-es-processor`. The only thing you need to do for running `taas-es-processor` locally is clone the [taas-es-processor](https://github.com/topcoder-platform/taas-es-processor) repository and inside `taas-es-processor` folder run:
   - `nvm use` - to use correct Node version
   - `npm run install`
   - Create `.env` file with the next environment variables. Values for **Auth0 config** should be shared with you on the forum.<br>

      ```bash
      # Auth0 config
      AUTH0_URL=
      AUTH0_AUDIENCE=
      AUTH0_CLIENT_ID=
      AUTH0_CLIENT_SECRET=
      ```

      - Values from this file would be automatically used by many `npm` commands.
      - ⚠️ Never commit this file or its copy to the repository!

   - `npm run start`

## NPM Commands

| Command&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | Description                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run lint`                                                                                                            | Check for for lint errors.                                                                                                                         |
| `npm run lint:fix`                                                                                                        | Check for for lint errors and fix error automatically when possible.                                                                               |
| `npm run build`                                                                                                           | Build source code for production run into `dist` folder.                                                                                           |
| `npm run start`                                                                                                           | Start app in the production mode from prebuilt `dist` folder.                                                                                      |
| `npm run dev`                                                                                                             | Start app in the development mode using `nodemon`.                                                                                                 |
| `npm run start:test`                                                                                                      | Start app in the test mode.                                                                                                                        |
| `npm run test`                                                                                                            | Run tests.                                                                                                                                         |
| `npm run init-db`                                                                                                         | Initializes Database.                                                                                                                              |
| `npm run create-index`                                                                                                    | Create Elasticsearch indexes. Use `-- --force` flag to skip confirmation                                                                           |
| `npm run delete-index`                                                                                                    | Delete Elasticsearch indexes. Use `-- --force` flag to skip confirmation                                                                           |
| `npm run data:import <filePath>`                                                                                          | Imports data into ES and db from filePath (`./data/demo-data.json` is used as default). Use `-- --force` flag to skip confirmation                 |
| `npm run data:export <filePath>`                                                                                          | Exports data from ES and db into filePath (`./data/demo-data.json` is used as default). Use `-- --force` flag to skip confirmation                 |
| `npm run index:all`                                                                                                       | Indexes all data from db into ES. Use `-- --force` flag to skip confirmation                                                                       |
| `npm run index:jobs <jobId>`                                                                                              | Indexes job data from db into ES, if jobId is not given all data is indexed. Use `-- --force` flag to skip confirmation                            |
| `npm run index:job-candidates <jobCandidateId>`                                                                           | Indexes job candidate data from db into ES, if jobCandidateId is not given all data is indexed. Use `-- --force` flag to skip confirmation         |
| `npm run index:resource-bookings <resourceBookingsId>`                                                                    | Indexes resource bookings data from db into ES, if resourceBookingsId is not given all data is indexed. Use `-- --force` flag to skip confirmation |
| `npm run index:roles <roleId>`                                                                                            | Indexes roles data from db into ES, if roleId is not given all data is indexed. Use `-- --force` flag to skip confirmation                         |
| `npm run services:up`                                                                                                     | Start services via docker-compose for local development.                                                                                           |
| `npm run services:down`                                                                                                   | Stop services via docker-compose for local development.                                                                                            |
| `npm run services:logs -- -f <service_name>`                                                                              | View logs of some service inside docker-compose.                                                                                                   |
| `npm run services:rebuild -- -f <service_name>`                                                                           | Rebuild service container ignoring cache (useful when pushed something to the Git repository of service)                                           |
| `npm run local:init`                                                                                                      | Recreate Database and Elasticsearch indexes and populate demo data for local development (removes any existent data).                              |
| `npm run local:reset`                                                                                                     | Recreate Database and Elasticsearch indexes (removes any existent data).                                                                           |
| `npm run cov`                                                                                                             | Code Coverage Report.                                                                                                                              |
| `npm run migrate`                                                                                                         | Run any migration files which haven't run yet.                                                                                                     |
| `npm run migrate:undo`                                                                                                    | Revert most recent migration.                                                                                                                      |
| `npm run demo-email-notifications`                                                                                          | Listen to the Kafka events of email notification and render all the emails into `./out` folder. See [its readme](scripts/demo-email-notifications/README.md) for details. |
| `npm run emsi-mapping`                                                                                                    | mapping EMSI tags to topcoder skills                                                                                                               |
| `npm run mock-api`                                                                                                        | Starts the mock api                                                                                                                                |
| `npm test:newman`                                                                                                         | Starts E2E tests with newman                                                                                                                       |
| `npm test:newman:clear`                                                                                                   | Clears the data produced during E2E tests                                                                                                          |

## Import and Export data

### 📤 Export data

To export data to the default file `data/demo-data.json`, run:
```bash
npm run data:export
```

If you want to export data to another file, run:

```bash
npm run data:export -- --file path/to-file.json
```

- List of models that will be exported are defined in `scripts/data/exportData.js`.

### 📥 Import data

⚠️ This command would clear any existent data in DB and ES before importing.

*During importing, data would be first imported to the database, and after from the database it would be indexed to the Elasticsearch index.*

To import data from the default file `data/demo-data.json`, run:
```bash
npm run data:import
```

If you want to import data from another file, run:

```bash
npm run data:import -- --file path/to-file.json
```

- List of models that will be imported are defined in `scripts/data/importData.js`.

## Kafka commands

If you've used `docker-compose` with the file `local/docker-compose.yml` during local setup to spawn kafka & zookeeper, you can use the following commands to manipulate kafka topics and messages:
(Replace `TOPIC_NAME` with the name of the desired topic)

### Create Topic

```bash
docker exec tc-taas-kafka /opt/kafka/bin/kafka-topics.sh --create --zookeeper zookeeper:2181 --partitions 1 --replication-factor 1 --topic TOPIC_NAME
```

### List Topics

```bash
docker exec tc-taas-kafka /opt/kafka/bin/kafka-topics.sh --list --zookeeper zookeeper:2181
```

### Watch Topic

```bash
docker exec tc-taas-kafka /opt/kafka/bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic TOPIC_NAME
```

### Post Message to Topic (from stdin)

```bash
docker exec -it tc-taas-kafka /opt/kafka/bin/kafka-console-producer.sh --broker-list localhost:9092 --topic TOPIC_NAME
```

- Enter or copy/paste the message into the console after starting this command.

## Email Notifications

We have various email notifications. For example many emails are sent to support Interview Scheduling Workflow. All email templates are placed inside the [.data/notification-email-templates](./data/notification-email-templates/) folder.

### Add a new Email Notification

To add a new email notification:

0. Each email notification need to have a unique topic identifier of the shape `taas.notification.{notification-type}`. Where `{notification-type}` is unique for each email notification type.
1. Create a new HTML template inside folder  [.data/notification-email-templates](./data/notification-email-templates/). (You may duplicate any existent template to reuse existent styles.). Name it the same as topic: `taas.notification.{notification-type}.html`.
2. Create a corresponding config in file [./config/email_template.config.js](./config/email_template.config.js), section `notificationEmailTemplates`.
3. Name environment variable the same as topic, but **uppercase** and replace all special symbols to `_` and add suffix `_SENDGRID_TEMPLATE_ID`:
   - For example topic `taas.notification.job-candidate-resume-viewed` would have corresponding environment variable
`TAAS_NOTIFICATION_JOB_CANDIDATE_RESUME_VIEWED_SENDGRID_TEMPLATE_ID`.
4. When deploying to DEV/PROD someone would have to create a new Sendgird template and fill inside Sendgrid UI subject and email HTML template by copy/pasting HTML file from the repo. And then set environment variable with the value of template if provided by Sendgrid.

### Test/Render Email Notifications Locally

To test and render email notification locally run a special script `npm run demo-email-notifications`. Before running it, follow it's [README](./scripts/demo-email-notifications/README.md) as you would have to set some additional environment variables first (add them into `.env` file).

- This script first would update demo data to create some situations to trigger notifications.
- And it would listen to Kafka events and render email notification into `./out` folder.

## DB Migration

- `npm run migrate`: run any migration files which haven't run yet.
- `npm run migrate:undo`: revert most recent migration.

Configuration for migration is at `./config/config.json`.

The following parameters can be set in the config file or via env variables:

- `url`: set via env `DATABASE_URL`; datebase url

## Testing

### Unit Tests

- Run `npm run test` to execute unit tests
- Run `npm run cov` to execute unit tests and generate coverage report.

### E2E Postman Tests

1. In the `taas-apis` root directory create `.env` file with the next environment variables.

      ```bash
      # Auth0 config
      AUTH_SECRET=
      AUTH0_URL=
      AUTH0_AUDIENCE=
      AUTH0_AUDIENCE_UBAHN=
      AUTH0_CLIENT_ID=
      AUTH0_CLIENT_SECRET=
      AUTH_V2_URL=
      AUTH_V2_CLIENT_ID=
      AUTH_V3_URL=
      # Following configs are used to generate tokens.
      ADMIN_CREDENTIALS_USERNAME=
      ADMIN_CREDENTIALS_PASSWORD=
      MANAGER_CREDENTIALS_USERNAME=
      MANAGER_CREDENTIALS_PASSWORD=
      COPILOT_CREDENTIALS_USERNAME=
      COPILOT_CREDENTIALS_PASSWORD=
      USER_CREDENTIALS_USERNAME=
      USER_CREDENTIALS_PASSWORD=
      # Locally deployed services
      ES_HOST=http://localhost:9200
      DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres
      BUSAPI_URL=http://localhost:8002/v5
      MOCK_API_PORT=4000
      API_BASE_URL=http://localhost:3000
      TC_API=http://localhost:4000/v5
      TOPCODER_USERS_API=http://localhost:4000/v3/users
      TOPCODER_MEMBERS_API=http://localhost:4000/v3/members
      ```
1. Install npm dependencies
   ```bash
   npm install
   ```
1. Start services and mock api and make sure taas-es-processor started properly by viewing logs.

   ```bash
   npm run services:up
   npm run mock-api
   ```
1. Start taas-api in test mode
   ```bash
   npm run start:test
   ```
1. Create Database tables and Elasticsearch indexes
   ```bash
   npm run init-db
   npm run create-index
   ```
1. Run tests
   ```bash
   npm run test:newman
   ```
1. Clear test data produced during tests
   ```bash
   npm run test:newman:clear
   ```

## 📋 Code Guidelines

### General Requirements

- Split code into reusable methods where applicable.
- Lint should pass.
- Unit tests should pass.

### Documentation and Utils

When we add, update or delete models and/or endpoints we have to make sure that we keep documentation and utility scripts up to date.

- **Swagger**
- **Postman**
- **ES Mapping**
  - Update mapping definitions for ElasticSearch indexes inside both repositories [taas-apis](https://github.com/topcoder-platform/taas-apis) and [taas-es-processor](https://github.com/topcoder-platform/taas-es-processor).
- **Reindex**
  - NPM command `index:all` should re-index data in all ES indexes.
  - There should be an individual NPM command `index:*` which would re-index data only in one ES index.
- **Import/Export**
  - NPM commands `data:import` and `data:export` should support importing/exporting data from/to all the models.
- **Create/Delete Index**
  - NPM commands `create-index` and `delete-index` should support creating/deleting all the indexes.
- **DB Migration**
  - If there are any updates in DB schemas, create a DB migration script inside `migrations` folder which would make any necessary updates to the DB schema.
  - Test, that when we migrate DB from the previous state using `npm run migrate`, we get exactly the same DB schema as if we create DB from scratch using command `npm run init-db force`.

## EMSI mapping

mapping EMSI tags to topcoder skills
Run `npm run emsi-mapping` to create the mapping file
It will take about 15 minutes to create the mapping file `script/emsi-mapping/emsi-skils-mapping.js`
