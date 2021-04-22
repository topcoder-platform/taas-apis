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
   * - interviewType: the x.ai interview type. Example: "30-min-interview"
   * - candidateName: Full name of candidate. Example: "John Doe"
   * - jobName: The title of the job. Example: "TaaS API Misc Updates"
   * - customMessage: if it's needed, a custom message can be added to the end of email. Example: "I would like to invite you for an interview..."
   *
   * Template (defined in SendGrid):
   * Subject: '/{{interviewType}} tech interview with {{candidateName}} for {{jobName}} is requested by the Customer'
   * Body:
   * 'The customer has requested /{{interviewType}} with {{candidateName}} for {{jobName}}.'
   * + 'In a few minutes you will receive an invitation from our scheduling tool. Please proceed with the invitation to agree on timing.'
   * + '<br /><br />{{customMessage}}'
   *
   * Note, that the template should be defined in SendGrid.
   * The subject & body above (identical to actual SendGrid template) is for reference purposes.
   * We won't pass subject & body but only substitutions (replacements in template subject/body).
   */
  'interview-invitation': {
    from: config.INTERVIEW_INVITATION_SENDER_EMAIL,
    cc: config.INTERVIEW_INVITATION_CC_LIST,
    sendgridTemplateId: config.INTERVIEW_INVITATION_SENDGRID_TEMPLATE_ID
  }
}
