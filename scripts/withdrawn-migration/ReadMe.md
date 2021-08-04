Steps:

1. Put the withdrawn-migration inside the scripts folder
2. Add below three commands into the package.json

    "migrate:backup-withdrawn": "node scripts/withdrawn-migration/backup.js",
    "migrate:migration-withdrawn": "node scripts/withdrawn-migration/migration.js",
    "migrate:restore-withdrawn": "node scripts/withdrawn-migration/restore.js"

3. Run `npm run migrate:backup-withdrawn` - this will create a buckup file regarding the jobCandidate we will update - naming convension is `jobcandidate-backup-Fri Jul 23 2021 23:53:20 GMT+0800 (GMT+08:00).json`

4. Double check the jobcandidate-backup-date.json file and once confirmed the backup file, rename the file into
`jobcandidate-backup.json` name

5. Run `npm run migrate:migration-withdrawn` , make sure to keep the `jobcandidate-backup.json` file for a while, as if we need to restore the db, we will need it.

6. We can use `npm run migrate:restore-withdrawn`