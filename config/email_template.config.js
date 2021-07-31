/*
 * Configure email templates.
 * Variables can be used inside the subject and the message of a template(enclosed in double curly braces).
 */

const config = require('config')

module.exports = {
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
  },

  /* Request interview for a job candidate
   *
   * - interviewType: the x.ai interview type. Example: "interview-30"
   * - interviewRound: the round of the interview. Example: 2
   * - interviewDuration: duration of the interview, in minutes. Example: 30
   * - interviewerList: The list of interviewer email addresses. Example:  "first@attendee.com, second@attendee.com"
   * - candidateId: the id of the jobCandidate. Example: "cc562545-7b75-48bf-87e7-50b3c57e41b1"
   * - candidateName: Full name of candidate. Example: "John Doe"
   * - jobName: The title of the job. Example: "TaaS API Misc Updates"
   *
   * Template (defined in SendGrid):
   * Subject: '{{interviewType}} tech interview with {{candidateName}} for {{jobName}} is requested by the Customer'
   * Body:
   * 'Hello!
   *  <br /><br />
   *  Congratulations, you have been selected to participate in a Topcoder Gig Work Interview!
   *  <br /><br />
   *  Please monitor your email for a response to this where you can coordinate your availability.
   *  <br /><br />
   *  Interviewee: {{candidateName}}<br />
   *  Interviewer(s): {{interviewerList}}<br />
   *  Interview Length: {{interviewDuration}} minutes
   *  <br /><br />
   *  /{{interviewType}}
   *  <br /><br />
   *  Topcoder Info:<br />
   *  Note: "id: {{candidateId}}, round: {{interviewRound}}"'
   *
   * Note, that the template should be defined in SendGrid.
   * The subject & body above (identical to actual SendGrid template) is for reference purposes.
   * We won't pass subject & body but only substitutions (replacements in template subject/body).
   */
  'interview-invitation': {
    subject: '',
    body: '',
    from: config.INTERVIEW_INVITATION_SENDER_EMAIL,
    cc: config.INTERVIEW_INVITATION_CC_LIST,
    recipients: config.INTERVIEW_INVITATION_RECIPIENTS_LIST,
    sendgridTemplateId: config.INTERVIEW_INVITATION_SENDGRID_TEMPLATE_ID
  },
  'candidate-review': {
    subject: 'Topcoder - {{teamName}} has job candidates available for review',
    body: '',
    recipients: [],
    from: config.NOTIFICATION_SENDER_EMAIL,
    sendgrid_template_id: config.NOTIFICATION_SENDGRID_TEMPLATE_ID
  },
  'interview-coming-up-host': {
    subject: 'Topcoder - Interview Coming Up: {{jobTitle}} with {{guestFullName}}',
    body: '',
    recipients: [],
    from: config.NOTIFICATION_SENDER_EMAIL,
    sendgrid_template_id: config.NOTIFICATION_SENDGRID_TEMPLATE_ID
  },
  'interview-coming-up-guest': {
    subject: 'Topcoder - Interview Coming Up: {{jobTitle}} with {{hostFullName}}',
    body: '',
    recipients: [],
    from: config.NOTIFICATION_SENDER_EMAIL,
    sendgrid_template_id: config.NOTIFICATION_SENDGRID_TEMPLATE_ID
  },
  'interview-completed': {
    subject: 'Topcoder - Interview Awaits Resolution: {{jobTitle}} for {{guestFullName}}',
    body: '',
    recipients: [],
    from: config.NOTIFICATION_SENDER_EMAIL,
    sendgrid_template_id: config.NOTIFICATION_SENDGRID_TEMPLATE_ID
  },
  'post-interview-action': {
    subject: 'Topcoder - Candidate Action Required in {{teamName}} for {{numCandidates}} candidates',
    body: '',
    recipients: [],
    from: config.NOTIFICATION_SENDER_EMAIL,
    sendgrid_template_id: config.NOTIFICATION_SENDGRID_TEMPLATE_ID
  },
  'resource-booking-expiration': {
    subject: 'Topcoder - Resource Booking Expiring in {{teamName}} for {{numResourceBookings}} resource bookings',
    body: '',
    recipients: [],
    from: config.NOTIFICATION_SENDER_EMAIL,
    sendgrid_template_id: config.NOTIFICATION_SENDGRID_TEMPLATE_ID
  }
}
