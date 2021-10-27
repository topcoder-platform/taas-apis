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
    INTERVIEW_COMING_UP_MATCH_WINDOW=PT1M
    INTERVIEW_COMPLETED_MATCH_WINDOW=PT1M
    TAAS_NOTIFICATION_JOB_CANDIDATE_RESUME_VIEWED_SENDGRID_TEMPLATE_ID=1
    TAAS_NOTIFICATION_CANDIDATES_AVAILABLE_FOR_REVIEW_SENDGRID_TEMPLATE_ID=2
    TAAS_NOTIFICATION_INTERVIEW_COMING_UP_HOST_SENDGRID_TEMPLATE_ID=3
    TAAS_NOTIFICATION_INTERVIEW_COMING_UP_GUEST_SENDGRID_TEMPLATE_ID=4
    TAAS_NOTIFICATION_INTERVIEW_AWAITS_RESOLUTION_SENDGRID_TEMPLATE_ID=5
    TAAS_NOTIFICATION_POST_INTERVIEW_ACTION_REQUIRED_SENDGRID_TEMPLATE_ID=6
    TAAS_NOTIFICATION_RESOURCE_BOOKING_EXPIRATION_SENDGRID_TEMPLATE_ID=7
    TAAS_NOTIFICATION_TEAM_CREATED_SENDGRID_TEMPLATE_ID=8
    TAAS_NOTIFICATION_JOB_CREATED_SENDGRID_TEMPLATE_ID=9
    TAAS_NOTIFICATION_RESOURCE_BOOKING_PLACED_SENDGRID_TEMPLATE_ID=10
    TAAS_NOTIFICATION_INTERVIEWS_OVERLAPPING_SENDGRID_TEMPLATE_ID=11
    TAAS_NOTIFICATION_JOB_CANDIDATE_SELECTED_SENDGRID_TEMPLATE_ID=12
    TAAS_NOTIFICATION_INTERVIEW_SCHEDULE_REMINDER_SENDGRID_TEMPLATE_ID=13
    TAAS_NOTIFICATION_INTERVIEW_EXPIRED_GUEST_SENDGRID_TEMPLATE_ID=14
    TAAS_NOTIFICATION_INTERVIEW_EXPIRED_HOST_SENDGRID_TEMPLATE_ID=15
    TAAS_NOTIFICATION_INTERVIEW_INVITATION_SENDGRID_TEMPLATE_ID=16
    TAAS_NOTIFICATION_INTERVIEW_LINK_FOR_HOST_SENDGRID_TEMPLATE_ID=17
    TAAS_NOTIFICATION_INTERVIEW_LINK_FOR_GUEST_SENDGRID_TEMPLATE_ID=18
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
