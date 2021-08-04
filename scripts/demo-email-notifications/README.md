# Trigger and render demo Email Notifications.

This script does 2 things:

- update demo data created by `npm run local:init` inside the DB in such a way that it would create situation for Email Notifications which would be triggered by the scheduler to demonstrate all possible cases.
- start Kafka Consumer that would listen to the Kafka Topic `config.NOTIFICATIONS_CREATE_TOPIC` and if there is email notification created, it would render it using provided email template `data/notifications-email-template.html` into `out` folder.

## Usage

1. Config scheduler to run more often so we don't have to wait to long for triggering notification, like every minute:

    ```sh
    CRON_CANDIDATE_REVIEW=0 */1 * * * *
    CRON_INTERVIEW_COMING_UP=0 */1 * * * *
    CRON_INTERVIEW_COMPLETED=0 */1 * * * *
    CRON_POST_INTERVIEW=0 */1 * * * *
    CRON_UPCOMING_RESOURCE_BOOKING=0 */1 * * * *
    ```

2. Recreate demo data by:

    ```sh
    npm run local:init`

3. Run TaaS API by:

    ```sh
    npm run dev
    ```

4. Run this demo script:

   ```sh
   node scripts/demo-email-notifications
   ```

Check the rendered emails inside `out` folder.