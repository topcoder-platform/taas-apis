# Render Email Notification Template with some data

This script can render SendGrid Email Template (handlebars) `data/notifications-email-template.html` using some data from `data/notifications-email-demo-data.json` into `out/notifications-email-template-with-data.html`.

## Usage

Please run

```
node scripts/notification-email-template-renderer <notificationId>
```

where `<notificationId>` can be one of the keys in `data/notifications-email-demo-data.json` i.e:

- `candidatesAvailableForReview`
- `interviewComingUpForHost`
- `interviewComingUpForGuest`
- `interviewCompleted`
- `postInterviewCandidateAction`
- `upcomingResourceBookingExpiration`

The resulting file would be placed into `out/notifications-email-template-with-data.html`