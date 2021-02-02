# Topcoder Bookings API

## Dependencies

- nodejs https://nodejs.org/en/ (v12+)
- PostgreSQL
- ElasticSearch (7.x)
- Docker
- Docker-Compose

### Steps to run locally

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

      # Locally deployed services (via docker-compose)
      ES_HOST=dockerhost:9200
      DATABASE_URL=postgres://postgres:postgres@dockerhost:5432/postgres
      BUSAPI_URL=http://dockerhost:8002/v5
      ```

      - Values from this file would be automatically used by many `npm` commands.
      - ⚠️ Never commit this file or its copy to the repository!

   1. Set `dockerhost` to point the IP address of Docker. Docker IP address depends on your system. For example if docker is run on IP `127.0.0.1` add a the next line to your `/etc/hosts` file:

      ```
      127.0.0.1       dockerhost
      ```

      Alternatively, you may update `.env` file and replace `dockerhost` with your docker IP address.

3. 🚢 Start docker-compose with services which are required to start Topcoder Bookings API locally

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
   tc-taas-es-procesor  | Waiting for kafka-client to exit....
   ```

   - after that, `taas-es-processor` would be started itself. Make sure it successfully connected to Kafka, you should see 9 lines with text `Subscribed to taas.`:

   ```
   tc-taas-es-procesor  | 2021-01-22T14:27:48.971Z DEBUG no-kafka-client Subscribed to taas.jobcandidate.create:0 offset 0 leader kafka:9093
   tc-taas-es-procesor  | 2021-01-22T14:27:48.972Z DEBUG no-kafka-client Subscribed to taas.job.create:0 offset 0 leader kafka:9093
   tc-taas-es-procesor  | 2021-01-22T14:27:48.972Z DEBUG no-kafka-client Subscribed to taas.resourcebooking.delete:0 offset 0 leader kafka:9093
   tc-taas-es-procesor  | 2021-01-22T14:27:48.973Z DEBUG no-kafka-client Subscribed to taas.jobcandidate.delete:0 offset 0 leader kafka:9093
   tc-taas-es-procesor  | 2021-01-22T14:27:48.974Z DEBUG no-kafka-client Subscribed to taas.jobcandidate.update:0 offset 0 leader kafka:9093
   tc-taas-es-procesor  | 2021-01-22T14:27:48.975Z DEBUG no-kafka-client Subscribed to taas.resourcebooking.create:0 offset 0 leader kafka:9093
   tc-taas-es-procesor  | 2021-01-22T14:27:48.976Z DEBUG no-kafka-client Subscribed to taas.job.delete:0 offset 0 leader kafka:9093
   tc-taas-es-procesor  | 2021-01-22T14:27:48.977Z DEBUG no-kafka-client Subscribed to taas.job.update:0 offset 0 leader kafka:9093
   tc-taas-es-procesor  | 2021-01-22T14:27:48.978Z DEBUG no-kafka-client Subscribed to taas.resourcebooking.update:0 offset 0 leader kafka:9093
   ```

   </details>

   <br>
   If you want to learn more about docker-compose configuration
   <details><summary>see more details here</summary>
   <br>

   This docker-compose file starts the next services:
   | Service | Name | Port |
   |----------|:-----:|:----:|
   | PostgreSQL | postgres | 5432 |
   | Elasticsearch | elasticsearch | 9200 |
   | Zookeeper | zookeeper | 2181 |
   | Kafka | kafka | 9092 |
   | [tc-bus-api](https://github.com/topcoder-platform/tc-bus-api) | tc-bus-api | 8002 |
   | [taas-es-processor](https://github.com/topcoder-platform/taas-es-processor) | taas-es-processor | 5000 |

   - as many of the Topcoder services in this docker-compose require Auth0 configuration for M2M calls, our docker-compose file passes environment variables `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_URL`, `AUTH0_AUDIENCE`, `AUTH0_PROXY_SERVER_URL` to its containers. docker-compose takes them from `.env` file if provided.

   - `docker-compose` automatically would create Kafka topics which are used by `taas-es-processor` listed in `local/kafka-client/topics.txt`.

   - To view the logs from any container inside docker-compose use the following command, replacing `SERVICE_NAME` with the corresponding value under the **Name** column in the above table:

     ```bash
     npm run services:log -- -f SERVICE_NAME
     ```

   - If you want to modify the code of any of the services which are run inside this docker-compose file, you can stop such service inside docker-compose by command `docker-compose -f local/docker-compose.yml stop -f <SERVICE_NAME>` and run the service separately, following its README file.

   </details>

   _NOTE: In production these dependencies / services are hosted & managed outside Topcoder Bookings API._

4. ♻ Init DB, ES

   ```bash
   npm run local:init
   ```

   This command will do 2 things:

   - create Database table
   - create Elasticsearch indexes

5. 🚀 Start Topcoder Bookings API

   ```bash
   npm run dev
   ```

   Runs the Topcoder Bookings API using nodemon, so it would be restarted after any of the files is updated.
   The Topcoder Bookings API will be served on `http://localhost:3000`.

## NPM Commands

| Command&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | Description                                                          |
| ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `npm run lint`                                                                                                            | Check for for lint errors.                                           |
| `npm run lint:fix`                                                                                                        | Check for for lint errors and fix error automatically when possible. |
| `npm run build`                                                                                                           | Build source code for production run into `dist` folder.             |
| `npm run start`                                                                                                           | Start app in the production mode from prebuilt `dist` folder.        |
| `npm run dev`                                                                                                             | Start app in the development mode using `nodemon`.                   |
| `npm run test`                                                                                                            | Run tests.                                                           |
| `npm run test-data`                                                                                                       | Clears and imports Data into ES.                                     |
| `npm run init-db`                                                                                                         | Initializes Database.                                                |
| `npm run create-index`                                                                                                    | Create Elasticsearch indexes.                                        |
| `npm run delete-index`                                                                                                    | Delete Elasticsearch indexes.                                        |
| `npm run services:up`                                                                                                     | Start services via docker-compose for local development.             |
| `npm run services:down`                                                                                                   | Stop services via docker-compose for local development.              |
| `npm run services:logs -- -f <service_name>`                                                                              | View logs of some service inside docker-compose.                     |
| `npm run local:init`                                                                                                      | Creates Elasticsearch indexes and initializes Database.              |
| `npm run cov`                                                                                                             | Code Coverage Report.                                                |
| `npm run migrate`                                                                                                         | Run any migration files which haven't run yet.                       |
| `npm run migrate:undo`                                                                                                    | Revert most recent migration.                                        |

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

## DB Migration

- `npm run migrate`: run any migration files which haven't run yet.
- `npm run migrate:undo`: revert most recent migration.

Configuration for migration is at `./config/config.json`.

The following parameters can be set in the config file or via env variables:

- `username`: set via env `DB_USERNAME`; datebase username
- `password`: set via env `DB_PASSWORD`; datebase password
- `database`: set via env `DB_NAME`; datebase name
- `host`: set via env `DB_HOST`; datebase host name

## Testing

- Run `npm run test` to execute unit tests
- Run `npm run cov` to execute unit tests and generate coverage report.

## Verification

Refer to the verification document [Verification.md](Verification.md)
