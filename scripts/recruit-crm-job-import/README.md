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
export RCRM_IMPORT_TAAS_API_URL=http://localhost:3000/api/v5
node scripts/recruit-crm-job-import scripts/recruit-crm-job-import/example_data.csv | tee /tmp/report.txt
```

The example output is:

``` bash
DEBUG: processing line #1 - {"directProjectId":"24568","projectId":"(dynamic load)","externalId":"","title":"taas-demo-job5","startDate":"10/26/2020","endDate":"01/29/2021","numPositions":"2","userHandle":"nkumartest","jobid":"(dynamic load)","customerRate":"20","memberRate":"10","_lnum":1}
WARN: #1 - externalId is missing
DEBUG: processed line #1
DEBUG: processing line #2 - {"directProjectId":"24568","projectId":"(dynamic load)","externalId":"0","title":"taas-demo-job5","startDate":"10/26/2020","endDate":"01/29/2021","numPositions":"2","userHandle":"not_found_handle","jobid":"(dynamic load)","customerRate":"20","memberRate":"10","_lnum":2}
ERROR: #2 - handle: not_found_handle user not found
DEBUG: processed line #2
DEBUG: processing line #3 - {"directProjectId":"24568","projectId":"(dynamic load)","externalId":"0","title":"taas-demo-job5","startDate":"10/26/2020","endDate":"01/29/2021","numPositions":"2","userHandle":"nkumartest","jobid":"(dynamic load)","customerRate":"20","memberRate":"10","_lnum":3}
DEBUG: userHandle: nkumartest userId: 57646ff9-1cd3-4d3c-88ba-eb09a395366c
DEBUG: resourceBookingId: dc8b23d4-9987-4a7d-a587-2056283223de status: assigned
INFO: #3 - id: 7c8ed989-35bf-4899-9c93-708630a7c63b job already exists; id: dc8b23d4-9987-4a7d-a587-2056283223de resource booking created; id: dc8b23d4-9987-4a7d-a587-2056283223de status: assigned resource booking updated
DEBUG: processed line #3
DEBUG: processing line #4 - {"directProjectId":"24567","projectId":"(dynamic load)","externalId":"1212","title":"Dummy Description","startDate":"10/20/2020","endDate":"01/29/2021","numPositions":"2","userHandle":"pshah_manager","jobid":"(dynamic load)","customerRate":"150","memberRate":"100","_lnum":4}
DEBUG: userHandle: pshah_manager userId: a55fe1bc-1754-45fa-9adc-cf3d6d7c377a
DEBUG: resourceBookingId: 708469fb-ead0-4fc3-bef7-1ef4dd041428 status: assigned
INFO: #4 - id: f61da880-5295-40c2-b6db-21e6cdef93f9 job created; id: 708469fb-ead0-4fc3-bef7-1ef4dd041428 resource booking created; id: 708469fb-ead0-4fc3-bef7-1ef4dd041428 status: assigned resource booking updated
DEBUG: processed line #4
DEBUG: processing line #5 - {"directProjectId":"24566","projectId":"(dynamic load)","externalId":"23850272","title":"33fromzaps330","startDate":"02/21/2021","endDate":"03/15/2021","numPositions":"7","userHandle":"nkumar2","jobid":"(dynamic load)","customerRate":"50","memberRate":"30","_lnum":5}
DEBUG: userHandle: nkumar2 userId: 4b00d029-c87b-47b2-bfe2-0ab80d8b5774
DEBUG: resourceBookingId: 7870c30b-e511-48f2-8687-499ab116174f status: assigned
INFO: #5 - id: 72dc0399-5e4b-4783-9a27-ea07a4ce99a7 job created; id: 7870c30b-e511-48f2-8687-499ab116174f resource booking created; id: 7870c30b-e511-48f2-8687-499ab116174f status: assigned resource booking updated
DEBUG: processed line #5
DEBUG: processing line #6 - {"directProjectId":"24565","projectId":"(dynamic load)","externalId":"23843365","title":"Designer","startDate":"02/24/2021","endDate":"03/30/2021","numPositions":"1","userHandle":"GunaK-TopCoder","jobid":"(dynamic load)","customerRate":"70","memberRate":"70","_lnum":6}
DEBUG: userHandle: GunaK-TopCoder userId: 2bba34d5-20e4-46d6-bfc1-05736b17afbb
DEBUG: resourceBookingId: b2e705d3-6864-4697-96bb-dc2a288755bc status: assigned
INFO: #6 - id: 7ff0737e-958c-494e-8a5a-592ac1c5d4ff job created; id: b2e705d3-6864-4697-96bb-dc2a288755bc resource booking created; id: b2e705d3-6864-4697-96bb-dc2a288755bc status: assigned resource booking updated
DEBUG: processed line #6
DEBUG: processing line #7 - {"directProjectId":"24564","projectId":"(dynamic load)","externalId":"23836459","title":"demo-dev-19janV4","startDate":"01/20/2021","endDate":"01/30/2021","numPositions":"1","userHandle":"nkumar1","jobid":"(dynamic load)","customerRate":"400","memberRate":"200","_lnum":7}
DEBUG: userHandle: nkumar1 userId: ab19a53b-0607-4a99-8bdd-f3b0cb552293
DEBUG: resourceBookingId: 04299b4c-3f6e-4b3e-ae57-bf8232408cf9 status: assigned
INFO: #7 - id: 73301ade-40ff-4103-bd50-37b8d2a98183 job created; id: 04299b4c-3f6e-4b3e-ae57-bf8232408cf9 resource booking created; id: 04299b4c-3f6e-4b3e-ae57-bf8232408cf9 status: assigned resource booking updated
DEBUG: processed line #7
INFO: === summary ===
INFO: total: 7
INFO: success: 5
INFO: failure: 1
INFO: skips: 1
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
