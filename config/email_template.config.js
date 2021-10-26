/*
 * Configure email templates.
 * Variables can be used inside the subject and the message of a template(enclosed in double curly braces).
 */

const config = require('config')

module.exports = {
  /**
   * List all the kind of emails which could be sent by the endpoint `POST /taas-teams/email` inside `teamTemplates`.
   */
  teamTemplates: {
    /* Report a general issue for a team.
      *
      * - projectId: the project ID. Example: 123412
      * - projectName: the project name. Example: "TaaS API Misc Updates"
      * - reportText: the body of reported issue. Example: "I have issue with ... \n ... Thank you in advance!"
      */
    'team-issue-report': {
      subject: 'Issue Reported on TaaS Team {{projectName}} ({{projectId}}).',
      body: 'Project Name: {{projectName}}' + '\n' +
        'Project ID: {{projectId}}' + '\n' +
        `Project URL: ${config.TAAS_APP_URL}/{{projectId}}` + '\n' +
        '\n' +
        '{{reportText}}',
      recipients: config.REPORT_ISSUE_EMAILS,
      sendgridTemplateId: config.REPORT_ISSUE_SENDGRID_TEMPLATE_ID
    },

    /* Report issue for a particular member
     *
     * - userHandle: the user handle. Example: "bili_2021"
     * - projectId: the project ID. Example: 123412
     * - projectName: the project name. Example: "TaaS API Misc Updates"
     * - reportText: the body of reported issue. Example: "I have issue with ... \n ... Thank you in advance!"
     */
    'member-issue-report': {
      subject: 'Issue Reported for member {{userHandle}} on TaaS Team {{projectName}} ({{projectId}}).',
      body: 'User Handle: {{userHandle}}' + '\n' +
        'Project Name: {{projectName}}' + '\n' +
        'Project ID: {{projectId}}' + '\n' +
        `Project URL: ${config.TAAS_APP_URL}/{{projectId}}` + '\n' +
        '\n' +
        '{{reportText}}',
      recipients: config.REPORT_ISSUE_EMAILS,
      sendgridTemplateId: config.REPORT_ISSUE_SENDGRID_TEMPLATE_ID
    },

    /* Request extension for a particular member
     *
     * - userHandle: the user handle. Example: "bili_2021"
     * - projectId: the project ID. Example: 123412
     * - projectName: the project name. Example: "TaaS API Misc Updates"
     * - text: comment for the request. Example: "I would like to keep working with this member for 2 months..."
     */
    'extension-request': {
      subject: 'Extension Requested for member {{userHandle}} on TaaS Team {{projectName}} ({{projectId}}).',
      body: 'User Handle: {{userHandle}}' + '\n' +
        'Project Name: {{projectName}}' + '\n' +
        'Project ID: {{projectId}}' + '\n' +
        `Project URL: ${config.TAAS_APP_URL}/{{projectId}}` + '\n' +
        '\n' +
        '{{text}}',
      recipients: config.REPORT_ISSUE_EMAILS,
      sendgridTemplateId: config.REQUEST_EXTENSION_SENDGRID_TEMPLATE_ID
    }

  },

  /**
   * List all kind of emails which could be send as Email Notifications by scheduler, API endpoints or anything else.
   */
  notificationEmailTemplates: {
    'taas.notification.job-candidate-resume-viewed': {
      subject: 'Client has viewed your Topcoder profile',
      body: '',
      recipients: [],
      from: config.NOTIFICATION_SENDER_EMAIL,
      sendgridTemplateId: config.NOTIFICATION_CLIENT_VIEWED_PROFILE_SENDGRID_TEMPLATE_ID
    },
    'taas.notification.candidates-available-for-review': {
      subject: 'You have candidates to review',
      body: '',
      recipients: [],
      from: config.NOTIFICATION_SENDER_EMAIL,
      sendgridTemplateId: config.NOTIFICATION_REVIEW_CANDIDATES_SENDGRID_TEMPLATE_ID
    },
    'taas.notification.interview-coming-up-host': {
      subject: 'Interview reminder: Your Topcoder interview is coming up',
      body: '',
      recipients: [],
      from: config.NOTIFICATION_SENDER_EMAIL,
      sendgridTemplateId: config.NOTIFICATION_CUSTOMER_INTERVIEW_COMING_UP_SENDGRID_TEMPLATE_ID
    },
    'taas.notification.interview-coming-up-guest': {
      subject: 'Reminder: Interview coming up',
      body: '',
      recipients: [],
      from: config.NOTIFICATION_SENDER_EMAIL,
      sendgridTemplateId: config.NOTIFICATION_MEMBER_INTERVIEW_COMING_UP_SENDGRID_TEMPLATE_ID
    },
    'taas.notification.interview-invitation': {
      subject: 'Please select your available time',
      body: '',
      recipients: [],
      from: config.NOTIFICATION_SENDER_EMAIL,
      sendgridTemplateId: config.NOTIFICATION_MEMBER_INTERVIEW_INVITATION_SENDGRID_TEMPLATE_ID
    },
    'taas.notification.interview-link-for-host': {
      subject: 'You\'re meeting on {{start}}',
      body: '',
      recipients: [],
      from: config.NOTIFICATION_SENDER_EMAIL,
      sendgridTemplateId: config.NOTIFICATION_MEMBER_INTERVIEW_LINK_FOR_HOST_SENDGRID_TEMPLATE_ID
    },
    'taas.notification.interview-link-for-guest': {
      subject: 'Candidate confirmed meeting on {{start}}',
      body: '',
      recipients: [],
      from: config.NOTIFICATION_SENDER_EMAIL,
      sendgridTemplateId: config.NOTIFICATION_MEMBER_INTERVIEW_LINK_FOR_GUEST_SENDGRID_TEMPLATE_ID
    },
    'taas.notification.interview-expired-host': {
      subject: 'Your interview is expired',
      body: '',
      recipients: [],
      from: config.NOTIFICATION_SENDER_EMAIL,
      sendgridTemplateId: config.NOTIFICATION_CUSTOMER_INTERVIEW_EXPIRED_SENDGRID_TEMPLATE_ID
    },
    'taas.notification.interview-expired-guest': {
      subject: 'Interview expired - your candidate didn\'t select time',
      body: '',
      recipients: [],
      from: config.NOTIFICATION_SENDER_EMAIL,
      sendgridTemplateId: config.NOTIFICATION_MEMBER_INTERVIEW_EXPIRED_SENDGRID_TEMPLATE_ID
    },
    'taas.notification.interview-schedule-reminder': {
      subject: 'Reminder: Please select your available time for interview',
      body: '',
      recipients: [],
      from: config.NOTIFICATION_SENDER_EMAIL,
      sendgridTemplateId: config.NOTIFICATION_MEMBER_INTERVIEW_SCHEDULE_REMINDER_SENDGRID_TEMPLATE_ID
    },
    'taas.notification.interview-awaits-resolution': {
      subject: 'Interview complete - here’s what to do next',
      body: '',
      recipients: [],
      from: config.NOTIFICATION_SENDER_EMAIL,
      sendgridTemplateId: config.NOTIFICATION_INTERVIEW_COMPLETE_SENDGRID_TEMPLATE_ID
    },
    'taas.notification.post-interview-action-required': {
      subject: 'Reminder: Take action to reserve your talent',
      body: '',
      recipients: [],
      from: config.NOTIFICATION_SENDER_EMAIL,
      sendgridTemplateId: config.NOTIFICATION_POST_INTERVIEW_ACTION_SENDGRID_TEMPLATE_ID
    },
    'taas.notification.resource-booking-expiration': {
      subject: 'Reminder: 3 weeks left for your Topcoder Freelancer(s)',
      body: '',
      recipients: [],
      from: config.NOTIFICATION_SENDER_EMAIL,
      sendgridTemplateId: config.NOTIFICATION_UPCOMING_RESOURCE_BOOKING_EXPIRATION_SENDGRID_TEMPLATE_ID
    },
    'taas.notification.team-created': {
      subject: 'Your Topcoder talent request confirmation',
      body: '',
      recipients: [],
      from: config.NOTIFICATION_SENDER_EMAIL,
      sendgridTemplateId: config.NOTIFICATION_NEW_TEAM_CREATED_SENDGRID_TEMPLATE_ID
    },
    'taas.notification.job-created': {
      subject: 'New job added to your Topcoder team',
      body: '',
      recipients: [],
      from: config.NOTIFICATION_SENDER_EMAIL,
      sendgridTemplateId: config.NOTIFICATION_NEW_JOB_ADDED_SENDGRID_TEMPLATE_ID
    },
    'taas.notification.interviews-overlapping': {
      subject: 'Topcoder - Interviews overlapping',
      body: '',
      recipients: config.NOTIFICATION_OPS_EMAILS,
      from: config.NOTIFICATION_SENDER_EMAIL,
      sendgridTemplateId: config.NOTIFICATION_INTERVIEWS_OVERLAPPING_SENDGRID_TEMPLATE_ID
    },
    'taas.notification.job-candidate-selected': {
      subject: 'Topcoder - Job Candidate {{userHandle}} Selected for {{jobTitle}} in Team {{teamName}}',
      body: '',
      recipients: config.NOTIFICATION_OPS_EMAILS,
      from: config.NOTIFICATION_SENDER_EMAIL,
      sendgridTemplateId: config.NOTIFICATION_JOB_CANDIDATE_SELECTED_SENDGRID_TEMPLATE_ID
    },
    'taas.notification.resource-booking-placed': {
      subject: 'Your Topcoder talent is confirmed! How to start working with them.',
      body: '',
      recipients: [],
      from: config.NOTIFICATION_SENDER_EMAIL,
      sendgridTemplateId: config.NOTIFICATION_RESOURCE_BOOKING_PLACED_SENDGRID_TEMPLATE_ID
    }
  }
}
