# Topcoder Bookings API

## Dependencies

- nodejs https://nodejs.org/en/ (v12+)
- PostgreSQL
- ElasticSearch (7.x)
- Zookeeper
- Kafka
- Docker(version 20.10 and above)
- Docker-Compose

## DB Migration
- `npm run migrate`: run any migration files which haven't run yet.
- `npm run migrate:undo`: revert most recent migration.

Configuration for migration is at `./config/config.json`.

The following parameters can be set in the config file or via env variables:

- `username`: set via env `DB_USERNAME`; datebase username
- `password`: set via env `DB_PASSWORD`; datebase password
- `database`: set via env `DB_NAME`; datebase name
- `host`: set via env `DB_HOST`; datebase host name

### Steps to run locally
1. 📦 Install npm dependencies

   ```bash
   npm install
   ```

2. ⚙ Local config

    1. In the root directory create `.env` file with the next environment variables. Values for **Auth0 config** should be shared with you on the forum.<br>
       ```bash
       # Auth0 config
       AUTH0_URL=
       AUTH0_AUDIENCE=
       AUTH0_AUDIENCE_UBAHN=
       AUTH0_CLIENT_ID=
       AUTH0_CLIENT_SECRET=
       AUTH0_PROXY_SERVER_URL=

       # Locally deployed services (via docker-compose)
       ES_HOST=http://dockerhost:9200
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

1. 🚢 Start docker-compose with services which are required to start Taas API locally

   *(NOTE Please ensure that you have installed docker of version 20.10 or above since the docker-compose file uses new feature introduced by docker version 20.10. Run `docker --version` to check your docker version.)*

   ```bash
   npm run services:up
   ```

   Wait until all containers are fully started. As a good indicator, wait until `es-processor` successfully started by viewing its logs:

   ```bash
   npm run services:logs -- -f es-processor
   ```

   <details><summary>🖱️ Click to see a good logs example</summary>

    ``` bash
    tc-taas-es-processor | Waiting for kafka-client to exit....
    tc-taas-es-processor | kafka-client exited!
    tc-taas-es-processor |
    tc-taas-es-processor | > taas-es-processor@1.0.0 start /opt/app
    tc-taas-es-processor | > node src/app.js
    tc-taas-es-processor |
    tc-taas-es-processor | [2021-01-21T02:44:43.442Z] app INFO : Starting kafka consumer
    tc-taas-es-processor | 2021-01-21T02:44:44.534Z INFO no-kafka-client Joined group taas-es-processor generationId 1 as no-kafka-client-70c25a43-af93-495e-a123-0c4f4ea389eb
    tc-taas-es-processor | 2021-01-21T02:44:44.534Z INFO no-kafka-client Elected as group leader
    tc-taas-es-processor | 2021-01-21T02:44:44.614Z DEBUG no-kafka-client Subscribed to taas.jobcandidate.create:0 offset 0 leader kafka:9093
    tc-taas-es-processor | 2021-01-21T02:44:44.615Z DEBUG no-kafka-client Subscribed to taas.job.create:0 offset 0 leader kafka:9093
    tc-taas-es-processor | 2021-01-21T02:44:44.615Z DEBUG no-kafka-client Subscribed to taas.resourcebooking.delete:0 offset 0 leader kafka:9093
    tc-taas-es-processor | 2021-01-21T02:44:44.616Z DEBUG no-kafka-client Subscribed to taas.jobcandidate.delete:0 offset 0 leader kafka:9093
    tc-taas-es-processor | 2021-01-21T02:44:44.616Z DEBUG no-kafka-client Subscribed to taas.jobcandidate.update:0 offset 0 leader kafka:9093
    tc-taas-es-processor | 2021-01-21T02:44:44.617Z DEBUG no-kafka-client Subscribed to taas.resourcebooking.create:0 offset 0 leader kafka:9093
    tc-taas-es-processor | 2021-01-21T02:44:44.617Z DEBUG no-kafka-client Subscribed to taas.job.delete:0 offset 0 leader kafka:9093
    tc-taas-es-processor | 2021-01-21T02:44:44.618Z DEBUG no-kafka-client Subscribed to taas.job.update:0 offset 0 leader kafka:9093
    tc-taas-es-processor | 2021-01-21T02:44:44.618Z DEBUG no-kafka-client Subscribed to taas.resourcebooking.update:0 offset 0 leader kafka:9093
    tc-taas-es-processor | [2021-01-21T02:44:44.619Z] app INFO : Initialized.......
    tc-taas-es-processor | [2021-01-21T02:44:44.623Z] app INFO : taas.job.create,taas.job.update,taas.job.delete,taas.jobcandidate.create,taas.jobcandidate.update,taas.jobcandidate.delete,taas.resourcebooking.create,taas.resourcebooking.update,taas.resourcebooking.delete
    tc-taas-es-processor | [2021-01-21T02:44:44.623Z] app INFO : Kick Start.......
    tc-taas-es-processor | ********** Topcoder Health Check DropIn listening on port 3001
    tc-taas-es-processor | Topcoder Health Check DropIn started and ready to roll
    ```

   </details>

   If you want to learn more about docker-compose configuration
   <details><summary>🖱️ Click to see more details here</summary>
   <br>

      This docker-compose file starts the next services:
      |  Service | Name | Port  |
      |----------|:-----:|:----:|
      | PostgreSQL | db | 5432 |
      | Elasticsearch | esearch | 9200 |
      | Zookeeper | zookeeper | 2181  |
      | Kafka | kafka | 9092  |
      | [tc-bus-api](https://github.com/topcoder-platform/tc-bus-api) | bus-api | 8002  |
      | [taas-es-processor](https://github.com/topcoder-platform/taas-es-processor) | es-processor | 5000  |

      - as many of the Topcoder services in this docker-compose require Auth0 configuration for M2M calls, our docker-compose file passes environment variables `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_URL`, `AUTH0_AUDIENCE`, `AUTH0_PROXY_SERVER_URL` to its containers. docker-compose takes them from `.env` file if provided.

      - `docker-compose` automatically would create Kafka topics which are used by `taas-apis` listed in `./local/kafka-client/topics.txt`.

      - To view the logs from any container inside docker-compose use the following command, replacing `SERVICE_NAME` with the corresponding value under the **Name** column in the above table:

        ```bash
        npm run services:logs -- -f SERVICE_NAME
        ```

      - If you want to modify the code of any of the services which are run inside this docker-compose file, you can stop such service inside docker-compose by command `docker-compose -f local/docker-compose.yaml stop <SERVICE_NAME>` and run the service separately, following its README file.<br /><br />
      *NOTE: If kafka(along with zookeeper) is stopped and brings up in the host machine you will need to restart the `es-processor` service by running `docker-compose -f local/docker-compose.yaml restart es-processor` so the processor will connect with the new zookeeper.*

   *NOTE: In production these dependencies / services are hosted & managed outside Taas API.*

2. ♻ Init DB and ES

   ```bash
   npm run local:init
   ```

   This command will do 2 things:
   - create Database tables
   - create Elasticsearch indexes

3. 🚀 Start Taas API

   ```bash
   npm run dev
   ```

   Runs the Taas API using nodemon, so it would be restarted after any of the files is updated.
   The API will be served on `http://localhost:3000`.

## NPM Commands

| Command                                      | Description                                                          |
| --                                           | --                                                                   |
| `npm start`                                  | Start app.                                                           |
| `npm run dev`                                | Start app using `nodemon`.                                           |
| `npm run lint`                               | Check for for lint errors.                                           |
| `npm run lint:fix`                           | Check for for lint errors and fix error automatically when possible. |
| `npm run services:up`                        | Start services via docker-compose for local development.             |
| `npm run services:down`                      | Stop services via docker-compose for local development.              |
| `npm run services:logs -- -f <service_name>` | View logs of some service inside docker-compose.                     |
| `npm run local:init`                         | Create Database and Elasticsearch indexes.                           |
| `npm run init-db`                            | Create database.                                                     |
| `npm run init-db force`                      | Force re-creating database.                                          |
| `npm run create-index`                       | Create Elasticsearch indexes.                                        |
| `npm run delete-index`                       | Delete Elasticsearch indexes.                                        |
| `npm run migrate`                            | Run DB migration.                                                    |
| `npm run migrate:undo`                       | Undo DB migration executed previously                                |
| `npm run test-data`                          | Insert test data.                                                    |
| `npm run test`                               | Run tests.                                                           |
| `npm run cov`                                | Run test with coverage.                                              |

## Kafka Commands

You can use the following commands to manipulate kafka topics and messages:

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
docker exec  tc-taas-kafka /opt/kafka/bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic TOPIC_NAME
```

### Post Message to Topic (from stdin)

```bash
docker exec -it tc-taas-kafka /opt/kafka/bin/kafka-console-producer.sh --broker-list localhost:9092 --topic TOPIC_NAME
```

- Enter or copy/paste the message into the console after starting this command.

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
