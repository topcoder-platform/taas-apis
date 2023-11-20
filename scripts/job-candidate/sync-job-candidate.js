const models = require('../../src/models')

/**
 * Synchronizes the job_candidates tables with the JobCandidate
 * It propagates any updates to the JobCandidate model source code to the database table
 * including (new columns change, removed columns)
 * @returns {Promise<void>}
 */
const syncJobCandidate = async () => {
  // When force is set to false, the table will not be re-created
  // Need to be careful when using the `force` flag
  // If force is set to `true`, then the table will be DROPPED and re-created
  // Which will result in data loss
  await models.JobCandidate.sync({ force: false, alter: true })
}

syncJobCandidate().then(res => {
  console.log('job_candidates table successfully synchronized')
}).catch(err => {
  console.log('An error happened when synchronizing the job_candidates table')
  console.log(err)
})
