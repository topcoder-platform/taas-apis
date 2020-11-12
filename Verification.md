# Topcoder Bookings API

## Postman test
- start PostgreSQL and ElasticSearch
- Refer `README.md#Local Deployment` to start the app
- Import Postman collection and environment file in the `docs` folder to Postman and execute the scripts to validate the app from top to bottom.


## Unit test Coverage


``` bash
  78 passing (137ms)

----------------------------|---------|----------|---------|---------|-------------------
File                        | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
----------------------------|---------|----------|---------|---------|-------------------
All files                   |    98.1 |    91.55 |     100 |   98.28 |
 config                     |     100 |      100 |     100 |     100 |
  default.js                |     100 |      100 |     100 |     100 |
  test.js                   |     100 |      100 |     100 |     100 |
 src                        |   90.91 |       50 |     100 |   94.44 |
  bootstrap.js              |   90.91 |       50 |     100 |   94.44 | 18
 src/common                 |   97.17 |    90.91 |     100 |   97.12 |
  errors.js                 |     100 |       50 |     100 |     100 | 23
  helper.js                 |   96.88 |    92.86 |     100 |   96.81 | 94,176,284
 src/models                 |     100 |    92.86 |     100 |     100 |
  Job.js                    |     100 |      100 |     100 |     100 |
  JobCandidate.js           |     100 |      100 |     100 |     100 |
  ResourceBooking.js        |     100 |      100 |     100 |     100 |
  index.js                  |     100 |       80 |     100 |     100 | 29
 src/services               |   98.58 |    89.25 |     100 |   98.57 |
  JobCandidateService.js    |   98.77 |       88 |     100 |   98.77 | 37
  JobService.js             |   98.21 |    87.18 |     100 |   98.18 | 73,318
  ResourceBookingService.js |   98.86 |     93.1 |     100 |   98.86 | 54
----------------------------|---------|----------|---------|---------|-------------------
```
