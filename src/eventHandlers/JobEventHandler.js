/*
 * Handle events for Job.
 */

const { Op } = require('sequelize')
const models = require('../models')
const logger = require('../common/logger')
const helper = require('../common/helper')
const JobCandidateService = require('../services/JobCandidateService')

/**
 * Cancel all related related candidates when a job is cancelled.
 *
 * @param {Object} payload the event payload
 * @returns {undefined}
 */
async function cancelJob (payload) {
  if (payload.value.status === payload.options.oldValue.status) {
    logger.debug({
      component: 'JobEventHandler',
      context: 'cancelJob',
      message: 'status not changed'
    })
    return
  }
  if (payload.value.status !== 'cancelled') {
    logger.debug({
      component: 'JobEventHandler',
      context: 'cancelJob',
      message: `not interested job - status: ${payload.value.status}`
    })
    return
  }
  // pull data from db instead of directly extract data from the payload
  // since the payload may not contain all fields when it is from partially update operation.
  const job = await models.Job.findById(payload.value.id)
  const candidates = await models.JobCandidate.findAll({
    where: {
      jobId: job.id,
      status: {
        [Op.not]: 'cancelled'
      }
    }
  })
  await Promise.all(candidates.map(candidate => JobCandidateService.partiallyUpdateJobCandidate(
    helper.getAuditM2Muser(),
    candidate.id,
    { status: 'cancelled' }
  ).then(result => {
    logger.info({
      component: 'JobEventHandler',
      context: 'cancelJob',
      message: `id: ${result.id} candidate got cancelled.`
    })
  })))
}

/**
 * Process job update event.
 *
 * @param {Object} payload the event payload
 * @returns {undefined}
 */
async function processUpdate (payload) {
  await cancelJob(payload)
}

module.exports = {
  processUpdate
}
