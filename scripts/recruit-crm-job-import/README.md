Recruit CRM Data Import
===

# Configuration
Configuration file is at `./scripts/recruit-crm-job-import/config.js`.


# Usage
``` bash
node scripts/recruit-crm-job-import <pathname-to-a-csv-file>
```

By default the script creates jobs and resource bookings via `TC_API`.
# Example

Follow the README for Taas API to deploy Taas API locally and then point the script to the local API by running:

``` bash
export RCRM_IMPORT_CONFIG_NAMESAPCE=RCRM_IMPORT_
export RCRM_IMPORT_TAAS_API_URL=http://localhost:3000/api/v5
node scripts/recruit-crm-job-import scripts/recruit-crm-job-import/example_data.csv | tee /tmp/report.txt
```

The example output is:

``` bash
DEBUG: processing line #1 - {"directProjectId":"24568","projectId":"(dynamic load)","externalId":"","title":"taas-demo-job5","startDate":"10/26/2020","endDate":"01/29/2021","numPositions":"2","userHandle":"nkumartest","jobid":"(dynamic load)","customerRate":"20","memberRate":"10","_lnum":1}
WARN: #1 - externalId is missing
DEBUG: processed line #1
DEBUG: processing line #2 - {"directProjectId":"24568","projectId":"(dynamic load)","externalId":"0","title":"taas-demo-job5","startDate":"10/26/2020","endDate":"01/29/2021","numPositions":"2","userHandle":"not_found_handle","jobid":"(dynamic load)","customerRate":"20","memberRate":"10","_lnum":2}
ERROR: #2 - id: 51ce2216-0dee-4dcf-bf7d-79f862e8d63c job created; handle: not_found_handle user not found
DEBUG: processed line #2
DEBUG: processing line #3 - {"directProjectId":"24568","projectId":"(dynamic load)","externalId":"0","title":"taas-demo-job5","startDate":"10/26/2020","endDate":"01/29/2021","numPositions":"2","userHandle":"nkumartest","jobid":"(dynamic load)","customerRate":"20","memberRate":"10","_lnum":3}
DEBUG: userHandle: nkumartest userId: 57646ff9-1cd3-4d3c-88ba-eb09a395366c
INFO: #3 - id: 51ce2216-0dee-4dcf-bf7d-79f862e8d63c externalId: 0 job already exists; id: d49d2fbd-ba11-49dc-8eaa-5afafa7e993f resource booking created
DEBUG: processed line #3
DEBUG: processing line #4 - {"directProjectId":"24567","projectId":"(dynamic load)","externalId":"1212","title":"Dummy Description","startDate":"10/20/2020","endDate":"01/29/2021","numPositions":"2","userHandle":"pshah_manager","jobid":"(dynamic load)","customerRate":"150","memberRate":"100","_lnum":4}
DEBUG: userHandle: pshah_manager userId: a55fe1bc-1754-45fa-9adc-cf3d6d7c377a
INFO: #4 - id: e0267551-24fe-48b5-9605-719852901de2 job created; id: f6285f03-056d-446f-a69b-6d275a97d68a resource booking created
DEBUG: processed line #4
DEBUG: processing line #5 - {"directProjectId":"24566","projectId":"(dynamic load)","externalId":"23850272","title":"33fromzaps330","startDate":"02/21/2021","endDate":"03/15/2021","numPositions":"7","userHandle":"nkumar2","jobid":"(dynamic load)","customerRate":"50","memberRate":"30","_lnum":5}
DEBUG: userHandle: nkumar2 userId: 4b00d029-c87b-47b2-bfe2-0ab80d8b5774
INFO: #5 - id: cd94784c-432d-4c46-b860-04a89e7b1099 job created; id: 98604c13-c6f3-4203-b74f-db376e9f02e4 resource booking created
DEBUG: processed line #5
DEBUG: processing line #6 - {"directProjectId":"24565","projectId":"(dynamic load)","externalId":"23843365","title":"Designer","startDate":"02/24/2021","endDate":"03/30/2021","numPositions":"1","userHandle":"GunaK-TopCoder","jobid":"(dynamic load)","customerRate":"70","memberRate":"70","_lnum":6}
DEBUG: userHandle: GunaK-TopCoder userId: 2bba34d5-20e4-46d6-bfc1-05736b17afbb
INFO: #6 - id: 49883150-59c2-4e5b-b5c3-aaf6d11d0da2 job created; id: 5505b6b5-050c-421c-893f-b862b1a08092 resource booking created
DEBUG: processed line #6
DEBUG: processing line #7 - {"directProjectId":"24564","projectId":"(dynamic load)","externalId":"23836459","title":"demo-dev-19janV4","startDate":"01/20/2021","endDate":"01/30/2021","numPositions":"1","userHandle":"nkumar1","jobid":"(dynamic load)","customerRate":"400","memberRate":"200","_lnum":7}
DEBUG: userHandle: nkumar1 userId: ab19a53b-0607-4a99-8bdd-f3b0cb552293
INFO: #7 - id: b03dc641-d6be-4a15-9c86-ef38f0e20c28 job created; id: 8e332107-453b-4ec5-b934-902c829e73a2 resource booking created
DEBUG: processed line #7
INFO: === summary ===
INFO: total: 7
INFO: success: 5
INFO: failure: 1
INFO: skips: 1
INFO: jobs created: 5
INFO: resource bookings created: 5
INFO: jobs already exist: 1
INFO: resource bookings already exist: 0
INFO: validation errors: 0
INFO: user not found: 1
INFO: external id missing: 1
INFO: request error: 0
INFO: internal error: 0
INFO: === summary ===
INFO: done!
```

To list all skipped lines:

``` bash
cat /tmp/report.txt | grep 'WARN'
```

To find out whether there are some users not found by user handles, run the following command:

``` bash
cat /tmp/report.txt | grep 'ERROR' | grep 'user not found'
```
