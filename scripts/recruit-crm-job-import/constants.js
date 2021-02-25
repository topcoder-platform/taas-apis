/*
 * Constants for the RCRM import script.
 */

module.exports = {
  ProcessingStatus: {
    Successful: 'successful',
    Failed: 'failed',
    Skipped: 'skipped'
  },
  fieldNameMap: {
    DirectprojectId: 'directProjectId',
    externalId: 'externalId',
    title: 'title',
    startDate: 'startDate',
    endDate: 'endDate',
    numPositions: 'numPositions',
    userHandle: 'userHandle',
    customerRate: 'customerRate',
    memberRate: 'memberRate'
  }
}
