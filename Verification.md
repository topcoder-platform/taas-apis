# Topcoder Bookings API

## Postman test
- Refer `mock-project-service/ReadMe.md` to start the mock app
- Refer `ReadMe.md` to start the app and postgres database
- Run `npm run init-db` to init db before testing.
- Import Postman collection and environment file in the `docs` folder to Postman and execute the scripts to validate the app from top to bottom.



## Unit test Coverage


  62 passing (176ms)


File                        | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
----------------------------|---------|----------|---------|---------|-------------------
All files                   |   99.36 |       96 |     100 |   99.67 |                   
 config                     |     100 |      100 |     100 |     100 |                   
  default.js                |     100 |      100 |     100 |     100 |                   
  test.js                   |     100 |      100 |     100 |     100 |                   
 src                        |   90.48 |       50 |     100 |   94.12 |                   
  bootstrap.js              |   90.48 |       50 |     100 |   94.12 | 18                
 src/common                 |     100 |    96.55 |     100 |     100 |                   
  errors.js                 |     100 |       50 |     100 |     100 | 23                
  helper.js                 |     100 |      100 |     100 |     100 |                   
 src/models                 |     100 |    92.86 |     100 |     100 |                   
  Job.js                    |     100 |      100 |     100 |     100 |                   
  JobCandidate.js           |     100 |      100 |     100 |     100 |                   
  ResourceBooking.js        |     100 |      100 |     100 |     100 |                   
  index.js                  |     100 |       80 |     100 |     100 | 29                
 src/services               |     100 |      100 |     100 |     100 |                   
  JobCandidateService.js    |     100 |      100 |     100 |     100 |                   
  JobService.js             |     100 |      100 |     100 |     100 |                   
  ResourceBookingService.js |     100 |      100 |     100 |     100 |                   