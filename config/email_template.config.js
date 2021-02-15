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
    message: 'Project Name: {{projectName}}' + '\n' +
         'Project ID: {{projectId}}' + '\n' +
         `Project URL: ${config.TAAS_APP_URL}/{{projectId}}` + '\n' +
         '\n' +
         '{{reportText}}',
    recipients: [
      config.REPORT_ISSUE_EMAIL
    ],
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
    message: 'User Handle: {{userHandle}}' + '\n' +
         'Project Name: {{projectName}}' + '\n' +
         'Project ID: {{projectId}}' + '\n' +
         `Project URL: ${config.TAAS_APP_URL}/{{projectId}}` + '\n' +
         '\n' +
         '{{reportText}}',
    recipients: [
      config.REPORT_ISSUE_EMAIL
    ],
    sendgridTemplateId: config.REPORT_ISSUE_SENDGRID_TEMPLATE_ID
  }
}
