# Topcoder Bookings API

## Postman test
- start PostgreSQL and ElasticSearch
- Refer `README.md#Local Deployment` to start the app
- Import Postman collection and environment file in the `docs` folder to Postman and execute the scripts to validate the app from top to bottom.

## Note About Testing `/taas-teams` Endpoints
Before you run tests against the `taas-teams` endpoints, you should insert the dedicated test data by running `npm run test-data`.

## Unit test Coverage


``` bash
  96 passing (170ms)

----------------------------|---------|----------|---------|---------|----------------------------
File                        | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
----------------------------|---------|----------|---------|---------|----------------------------
All files                   |   98.43 |    91.03 |     100 |   98.56 |
 config                     |     100 |      100 |     100 |     100 |
  default.js                |     100 |      100 |     100 |     100 |
  test.js                   |     100 |      100 |     100 |     100 |
 src                        |   90.91 |       50 |     100 |   94.44 |
  bootstrap.js              |   90.91 |       50 |     100 |   94.44 | 18
 src/common                 |   97.69 |    90.91 |     100 |   97.66 |
  errors.js                 |     100 |       50 |     100 |     100 | 23
  helper.js                 |    97.5 |    92.86 |     100 |   97.46 | 94,176,284
 src/models                 |     100 |    92.86 |     100 |     100 |
  Job.js                    |     100 |      100 |     100 |     100 |
  JobCandidate.js           |     100 |      100 |     100 |     100 |
  ResourceBooking.js        |     100 |      100 |     100 |     100 |
  index.js                  |     100 |       80 |     100 |     100 | 29
 src/services               |   98.81 |     89.5 |     100 |    98.8 |
  JobCandidateService.js    |   98.77 |       88 |     100 |   98.77 | 37
  JobService.js             |   97.37 |    85.37 |     100 |   97.32 | 73,285,326
  ResourceBookingService.js |   98.86 |     93.1 |     100 |   98.86 | 54
  TeamService.js            |     100 |     90.7 |     100 |     100 | 19,135-138,188-202,251,267
----------------------------|---------|----------|---------|---------|----------------------------
```
