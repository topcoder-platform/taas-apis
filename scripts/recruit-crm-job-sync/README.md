Recruit CRM Job Data Sync Script
===

# Configuration
Configuration file is at `./scripts/recruit-crm-job-sync/config.js`.


# Usage
``` bash
node scripts/recruit-crm-job-sync <pathname-to-a-csv-file>
```

By default the script updates jobs via `TC_API`.

# Example

1. Follow the README for `taas-apis` to deploy Taas API locally
2. Create two jobs via `Jobs > create job with booking manager` in Postman, with external ids `51913016` and `51892637` for each of the jobs.

    **NOTE**: The external ids `51913016` and `51902826` could be found at `scripts/recruit-crm-job-sync/example_data.csv` under the Slug column.

3. Configure env variable `RCRM_SYNC_TAAS_API_URL` so that the script could make use of the local API:

    ``` bash
    export RCRM_SYNC_TAAS_API_URL=http://localhost:3000/api/v5
    ```

4. Run the script against the sample CSV file and pipe the output from the script to a temporary file:

    ``` bash
    node scripts/recruit-crm-job-sync scripts/recruit-crm-job-sync/example_data.csv | tee /tmp/report.txt
    ```

    The output should be like this:

    ``` bash
    DEBUG: processing line #1 - {"ID":"1","Name":"Data job  Engineer","Description":"","Qualification":"","Specialization":"","Minimum Experience In Years":"1","Maximum Experience In Years":"3","Minimum Annual Salary":"10","Maximum Annual Salary":"20","Number Of Openings":"2","Job Status":"Closed","Company":"company 1","Contact":"  ","Currency":"$","allowApply":"Yes","Collaborator":"","Locality":"","City":"","Job Code":"J123456","Createdby":"abc","Created On":"02-Jun-20","Updated By":"abc","Updated On":"17-Feb-21","Owner":"abc","Custom Column 1":"","Custom Column 2":"","Custom Column 3":"","Custom Column 4":"","Custom Column 5":"","Custom Column 6":"","Custom Column 7":"","Custom Column 8":"","Custom Column 9":"","Custom Column 10":"","Custom Column 11":"","Custom Column 12":"","Custom Column 13":"","Custom Column 14":"","Custom Column 15":"","externalId":"51892637","_lnum":1}
    ERROR: #1 - [EXTERNAL_ID_NOT_FOUND] externalId: 51892637 job not found
    DEBUG: processed line #1
    DEBUG: processing line #2 - {"ID":"2","Name":"JAVA coffee engineer","Description":"","Qualification":"","Specialization":"","Minimum Experience In Years":"2","Maximum Experience In Years":"5","Minimum Annual Salary":"10","Maximum Annual Salary":"20","Number Of Openings":"10","Job Status":"Closed","Company":"company 2","Contact":"abc","Currency":"$","allowApply":"Yes","Collaborator":"","Locality":"","City":"","Job Code":"J123457","Createdby":"abc","Created On":"02-Jun-20","Updated By":"abc","Updated On":"12-Nov-20","Owner":"abc","Custom Column 1":"","Custom Column 2":"","Custom Column 3":"","Custom Column 4":"","Custom Column 5":"","Custom Column 6":"","Custom Column 7":"","Custom Column 8":"","Custom Column 9":"","Custom Column 10":"","Custom Column 11":"","Custom Column 12":"","Custom Column 13":"","Custom Column 14":"","Custom Column 15":"","externalId":"51913016","_lnum":2}
    DEBUG: jobId: 34cee9aa-e45f-47ed-9555-ffd3f7196fec isApplicationPageActive(current): false - isApplicationPageActive(to be synced): true
    INFO: #2 - id: 34cee9aa-e45f-47ed-9555-ffd3f7196fec isApplicationPageActive: true "job" updated
    DEBUG: processed line #2
    DEBUG: processing line #3 - {"ID":"3","Name":"QA Seleinium","Description":"","Qualification":"","Specialization":"","Minimum Experience In Years":"3","Maximum Experience In Years":"7","Minimum Annual Salary":"10","Maximum Annual Salary":"20","Number Of Openings":"4","Job Status":"Canceled","Company":"company 3","Contact":"  ","Currency":"$","allowApply":"No","Collaborator":"","Locality":"","City":"","Job Code":"J123458","Createdby":"abc","Created On":"04-Jun-20","Updated By":"abc","Updated On":"12-Nov-20","Owner":"abc","Custom Column 1":"","Custom Column 2":"","Custom Column 3":"","Custom Column 4":"","Custom Column 5":"","Custom Column 6":"","Custom Column 7":"","Custom Column 8":"","Custom Column 9":"","Custom Column 10":"","Custom Column 11":"","Custom Column 12":"","Custom Column 13":"","Custom Column 14":"","Custom Column 15":"","externalId":"51902826","_lnum":3}
    DEBUG: jobId: 4acde317-c364-4b79-aa77-295b98143c8b isApplicationPageActive(current): false - isApplicationPageActive(to be synced): false
    WARN: #3 - isApplicationPageActive is already set
    DEBUG: processed line #3
    DEBUG: processing line #4 - {"ID":"5","Name":"Data Engineers and Data Architects","Description":"","Qualification":"","Specialization":"","Minimum Experience In Years":"4","Maximum Experience In Years":"9","Minimum Annual Salary":"10","Maximum Annual Salary":"20","Number Of Openings":"8","Job Status":"Closed","Company":"company 4","Contact":"  ","Currency":"$","allowApply":"Yes","Collaborator":"","Locality":"","City":"","Job Code":"J123459","Createdby":"abc","Created On":"09-Jun-20","Updated By":"abc","Updated On":"12-Nov-20","Owner":"abc","Custom Column 1":"","Custom Column 2":"","Custom Column 3":"","Custom Column 4":"","Custom Column 5":"","Custom Column 6":"","Custom Column 7":"","Custom Column 8":"","Custom Column 9":"","Custom Column 10":"","Custom Column 11":"","Custom Column 12":"","Custom Column 13":"","Custom Column 14":"","Custom Column 15":"","externalId":"51811161","_lnum":4}
    ERROR: #4 - [EXTERNAL_ID_NOT_FOUND] externalId: 51811161 job not found
    DEBUG: processed line #4
    DEBUG: processing line #5 - {"ID":"6","Name":"Docker Engineer","Description":"Java & J2EE or Python, Docker, Kubernetes, AWS or GCP","Qualification":"","Specialization":"","Minimum Experience In Years":"5","Maximum Experience In Years":"10","Minimum Annual Salary":"10","Maximum Annual Salary":"20","Number Of Openings":"5","Job Status":"Closed","Company":"company 5","Contact":"  ","Currency":"$","allowApply":"No","Collaborator":"","Locality":"","City":"","Job Code":"J123460","Createdby":"abc","Created On":"12-Jun-20","Updated By":"abc","Updated On":"12-Nov-20","Owner":"abc","Custom Column 1":"","Custom Column 2":"","Custom Column 3":"","Custom Column 4":"","Custom Column 5":"","Custom Column 6":"","Custom Column 7":"","Custom Column 8":"","Custom Column 9":"","Custom Column 10":"","Custom Column 11":"","Custom Column 12":"","Custom Column 13":"","Custom Column 14":"","Custom Column 15":"","externalId":"51821342","_lnum":5}
    ERROR: #5 - [EXTERNAL_ID_NOT_FOUND] externalId: 51821342 job not found
    DEBUG: processed line #5
    DEBUG: processing line #6 - {"ID":"7","Name":"lambda Developers","Description":"","Qualification":"","Specialization":"","Minimum Experience In Years":"0","Maximum Experience In Years":"0","Minimum Annual Salary":"10","Maximum Annual Salary":"20","Number Of Openings":"2","Job Status":"Closed","Company":"company 6","Contact":"abc","Currency":"$","allowApply":"Yes","Collaborator":"","Locality":"","City":"","Job Code":"J123461","Createdby":"abc","Created On":"12-Jun-20","Updated By":"abc","Updated On":"12-Nov-20","Owner":"abc","Custom Column 1":"","Custom Column 2":"","Custom Column 3":"","Custom Column 4":"","Custom Column 5":"","Custom Column 6":"","Custom Column 7":"","Custom Column 8":"","Custom Column 9":"","Custom Column 10":"","Custom Column 11":"","Custom Column 12":"","Custom Column 13":"","Custom Column 14":"","Custom Column 15":"","externalId":"51831524","_lnum":6}
    ERROR: #6 - [EXTERNAL_ID_NOT_FOUND] externalId: 51831524 job not found
    DEBUG: processed line #6
    DEBUG: processing line #7 - {"ID":"","Name":"","Description":"","Qualification":"","Specialization":"","Minimum Experience In Years":"","Maximum Experience In Years":"","Minimum Annual Salary":"","Maximum Annual Salary":"","Number Of Openings":"","Job Status":"","Company":"","Contact":"","Currency":"","allowApply":"","Collaborator":"","Locality":"","City":"","Job Code":"","Createdby":"","Created On":"","Updated By":"","Updated On":"","Owner":"","Custom Column 1":"","Custom Column 2":"","Custom Column 3":"","Custom Column 4":"","Custom Column 5":"","Custom Column 6":"","Custom Column 7":"","Custom Column 8":"","Custom Column 9":"","Custom Column 10":"","Custom Column 11":"","Custom Column 12":"","Custom Column 13":"","Custom Column 14":"","Custom Column 15":"","externalId":"","_lnum":7}
    ERROR: #7 - "allowApply" must be one of [Yes, No]
    DEBUG: processed line #7
    INFO: === summary ===
    INFO: No. of records read = 7
    INFO: No. of records updated for field isApplicationPageActive = true = 1
    INFO: No. of records updated for field isApplicationPageActive = false = 0
    INFO: No. of records : externalId not found = 4
    INFO: No. of records failed(all) = 5
    INFO: No. of records failed(excluding "externalId not found") = 1
    INFO: No. of records skipped = 1
    INFO: done!
    ```

    The following command could be used to extract the summary from the output:

    ``` bash
    cat /tmp/report.txt | grep 'No. of records' | cut -d' ' -f2-
    ```

    To list all skipped lines:

    ``` bash
    cat /tmp/report.txt | grep 'WARN' -B 3
