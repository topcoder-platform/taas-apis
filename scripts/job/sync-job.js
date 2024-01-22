const models = require('../../src/models')

/**
 * Synchronizes the job_candidates tables with the JobCandidate
 * It propagates any updates to the JobCandidate model source code to the database table
 * including (new columns change, removed columns)
 * @returns {Promise<void>}
 */
const syncJob = async () => {
  // When force is set to false, the table will not be re-created
  // Need to be careful when using the `force` flag
  // If force is set to `true`, then the table will be DROPPED and re-created
  // Which will result in data loss
  await models.Job.sync({ force: false, alter: true })
}

syncJob().then(res => {
  console.log('job table successfully synchronized')
  process.exit(0)
}).catch(err => {
  console.log('An error happened when synchronizing the job table')
  console.log(err)
})
