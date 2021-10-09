# Trigger and render demo Email Notifications.

This script does 2 things:

- update demo data created by `npm run local:init` inside the DB in such a way that it would create situation for Email Notifications which would be triggered by the scheduler to demonstrate all possible cases.
- start Kafka Consumer that would listen to the Kafka Topic `config.NOTIFICATIONS_CREATE_TOPIC` and if there is email notification created, it would render it using provided email template `data/notifications-email-template.html` into `out` folder.

## Usage

1. Config scheduler to run more often so we don't have to wait to long for triggering notification, like every minute:

    ```sh
2CRON_CANDIDATE_REVIEW=0 */1 * * * *
    CRON_INTERVIEW_COMING_UP=0 */1 * * * *
    CRON_INTERVIEW_COMPLETED=0 */1 * * * *
    CRON_POST_INTERVIEW=0 */1 * * * *
    CRON_UPCOMING_RESOURCE_BOOKING=0 */1 * * * *
    INTERVIEW_COMING_UP_MATCH_WINDOW=PT1M
    INTERVIEW_COMPLETED_MATCH_WINDOW=PT1M
    NOTIFICATION_CLIENT_VIEWED_PROFILE_SENDGRID_TEMPLATE_ID=1
    NOTIFICATION_REVIEW_CANDIDATES_SENDGRID_TEMPLATE_ID=2
    NOTIFICATION_CUSTOMER_INTERVIEW_COMING_UP_SENDGRID_TEMPLATE_ID=3
    NOTIFICATION_MEMBER_INTERVIEW_COMING_UP_SENDGRID_TEMPLATE_ID=4
    NOTIFICATION_INTERVIEW_COMPLETE_SENDGRID_TEMPLATE_ID=5
    NOTIFICATION_POST_INTERVIEW_ACTION_SENDGRID_TEMPLATE_ID=6
    NOTIFICATION_UPCOMING_RESOURCE_BOOKING_EXPIRATION_SENDGRID_TEMPLATE_ID=7
    NOTIFICATION_NEW_TEAM_CREATED_SENDGRID_TEMPLATE_ID=8
    NOTIFICATION_NEW_JOB_ADDED_SENDGRID_TEMPLATE_ID=9
    NOTIFICATION_RESOURCE_BOOKING_PLACED_SENDGRID_TEMPLATE_ID=10
    NOTIFICATION_INTERVIEWS_OVERLAPPING_SENDGRID_TEMPLATE_ID=11
    NOTIFICATION_JOB_CANDIDATE_SELECTED_SENDGRID_TEMPLATE_ID=12
    ```
2. Config `SLACK_WEBHOOK_URL` env, if you want to send slack notifications

    ```sh
    SLACK_WEBHOOK_URL=https://hooks.slack.com/services/***
    ```

3. Recreate demo data by:

    ```sh
    npm run local:init`

4. Run TaaS API by:

    ```sh
    npm run dev
    ```

5. Run this demo script:

   ```sh
   node scripts/demo-email-notifications
   ```

Check the rendered emails inside `out` folder.
