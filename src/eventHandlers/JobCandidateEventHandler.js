/*
 * Handle events for JobCandidate.
 */

const _ = require('lodash')
const models = require('../models')
const logger = require('../common/logger')
const helper = require('../common/helper')
const JobService = require('../services/JobService')

/**
 * Once we create at least one JobCandidate for a Job, the Job status should be changed to in-review.
 *
 * @param {Object} payload the event payload
 * @returns {undefined}
 */
async function inReviewJob (payload) {
  const job = await models.Job.findById(payload.value.jobId)
  if (job.status === 'in-review') {
    logger.debug({
      component: 'JobCandidateEventHandler',
      context: 'inReviewJob',
      message: `id: ${job.id} job is already in in-review status`
    })
    return
  }

  const { candidates } = await JobService.getJob(
    helper.getAuditM2Muser(),
    job.id
  )

  const status = ['applied', 'skills-test', 'phone-screen', 'rejected-pre-screen']
  const needReview = _.find(candidates, (c) => {
    return !_.includes(status, c.status)
  })

  if (needReview) {
    await JobService.partiallyUpdateJob(
      helper.getAuditM2Muser(),
      job.id,
      { status: 'in-review' }
    ).then(result => {
      logger.info({
        component: 'JobCandidateEventHandler',
        context: 'inReviewJob',
        message: `id: ${result.id} job got in-review status.`
      })
    })
  } else {
    logger.debug({
      component: 'JobCandidateEventHandler',
      context: 'inReviewJob',
      message: `id: ${job.id} job doesn't have candidates to review`
    })
  }
}

/**
 * Process job candidate create event.
 *
 * @param {Object} payload the event payload
 * @returns {undefined}
 */
async function processCreate (payload) {
  await inReviewJob(payload)
}

module.exports = {
  processCreate
}
