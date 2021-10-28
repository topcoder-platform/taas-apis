/**
 * Interview Processor
 */

const _ = require('lodash')
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
    refresh: true
  })
}

/**
 * Process request interview entity.
 * Creates an interview record under jobCandidate.
 *
 * @param {Object} interview interview object
 */
async function processRequestInterview (interview) {
  // add interview in collection if there's already an existing collection
  // or initiate a new one with this interview
  const script = {
    source: `
      ctx._source.containsKey("interviews")
        ? ctx._source.interviews.add(params.interview)
        : ctx._source.interviews = [params.interview]
    `,
    params: { interview }
  }
  await updateJobCandidateViaScript(interview.jobCandidateId, script)
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

/**
 * Process bulk (partially) update interviews entity.
 * Currently supports status, updatedAt and updatedBy fields.
 * Update Joi schema to allow more fields.
 * (implementation should already handle new fields - just updating Joi schema should be enough)
 *
 * payload format:
 * {
 *   "jobCandidateId": {
 *     "interviewId": { ...fields },
 *     "interviewId2": { ...fields },
 *     ...
 *   },
 *   "jobCandidateId2": { // like above... },
 *   ...
 * }
 *
 * @param {Object} jobCandidates job candidates
 */
async function processBulkUpdateInterviews (jobCandidates) {
  // script to update & params
  const script = {
    source: `
      def completedInterviews = params.jobCandidates[ctx._id];
      for (interview in completedInterviews.entrySet()) {
        def interviewId = interview.getKey();
        def affectedFields = interview.getValue();
        def target = ctx._source.interviews.find(i -> i.id == interviewId);
        if (target != null) {
          for (field in affectedFields.entrySet()) {
            target[field.getKey()] = field.getValue();
          }
        }
      }
    `,
    params: { jobCandidates }
  }
  // update interviews
  await esClient.updateByQuery({
    index: config.get('esConfig.ES_INDEX_JOB_CANDIDATE'),
    body: {
      script,
      query: {
        ids: {
          values: _.keys(jobCandidates)
        }
      }
    },
    refresh: true
  })
}

module.exports = {
  processRequestInterview,
  processUpdateInterview,
  processBulkUpdateInterviews
}
