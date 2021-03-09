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
  }
}
