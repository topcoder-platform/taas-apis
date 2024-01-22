/**
 * Interview Processor
 */

const helper = require('../common/helper')
const config = require('config')

const esClient = helper.getESClient()

/**
 * Updates jobCandidate via a painless script
 *
 * @param {String} jobCandidateId job candidate id
 * @param {String} script script definition
 */
async function updateJobCandidateViaScript (jobCandidateId, script) {
  await esClient.update({
    index: config.get('esConfig.ES_INDEX_JOB_CANDIDATE'),
    id: jobCandidateId,
    body: { script },
    refresh: 'wait_for'
  })
}

/**
 * Process update interview entity
 * Updates the interview record under jobCandidate.
 *
 * @param {Object} interview interview object
 */
async function processUpdateInterview (interview) {
  // if there's an interview with this id,
  // update it
  const script = {
    source: `
      if (ctx._source.containsKey("interviews")) {
        def target = ctx._source.interviews.find(i -> i.id == params.interview.id);
        if (target != null) {
          for (prop in params.interview.entrySet()) {
            target[prop.getKey()] = prop.getValue()
          }
        }
      }
    `,
    params: { interview }
  }
  await updateJobCandidateViaScript(interview.jobCandidateId, script)
}

module.exports = {
  processUpdateInterview
}
