/*
 * Handle events for ResourceBooking.
 */

const { Op } = require('sequelize')
const models = require('../models')
const logger = require('../common/logger')
const helper = require('../common/helper')
const JobService = require('../services/JobService')
const JobCandidateService = require('../services/JobCandidateService')

/**
 * When ResourceBooking's status is changed to `assigned`
 * the corresponding JobCandidate record (with the same userId and jobId)
 * should be updated with status `selected`
 *
 * @param {String} jobId the job id
 * @param {String} userId the user id
 * @returns {undefined}
 */
async function selectJobCandidate (jobId, userId) {
  const candidates = await models.JobCandidate.findAll({
    where: {
      jobId,
      userId,
      status: {
        [Op.not]: 'selected'
      },
      deletedAt: null
    }
  })
  await Promise.all(candidates.map(candidate => JobCandidateService.partiallyUpdateJobCandidate(
    helper.getAuditM2Muser(),
    candidate.id,
    { status: 'selected' }
  ).then(result => {
    logger.info({
      component: 'ResourceBookingEventHandler',
      context: 'selectJobCandidate',
      message: `id: ${result.id} candidate got selected.`
    })
  })))
}

/**
 * Update the status of the Job to assigned when it positions requirement is fullfilled.
 *
 * @param {String} jobId the job id
 * @returns {undefined}
 */
async function assignJob (jobId) {
  const job = await models.Job.findById(jobId)
  if (job.status === 'assigned') {
    logger.debug({
      component: 'ResourceBookingEventHandler',
      context: 'assignJob',
      message: `job with projectId ${job.projectId} is already assigned`
    })
    return
  }
  const resourceBookings = await models.ResourceBooking.findAll({
    where: {
      jobId: job.id,
      status: 'assigned',
      deletedAt: null
    }
  })
  logger.debug({
    component: 'ResourceBookingEventHandler',
    context: 'assignJob',
    message: `the number of assigned resource bookings is ${resourceBookings.length} - the numPositions of the job is ${job.numPositions}`
  })
  if (job.numPositions === resourceBookings.length) {
    await JobService.partiallyUpdateJob(helper.getAuditM2Muser(), job.id, { status: 'assigned' })
    logger.info({ component: 'ResourceBookingEventHandler', context: 'assignJob', message: `job ${job.id} is assigned` })
  }
}

/**
 * Process resource booking update event.
 *
 * @param {Object} payload the event payload
 * @returns {undefined}
 */
async function processUpdate (payload) {
  if (payload.value.status === payload.options.oldValue.status) {
    logger.debug({
      component: 'ResourceBookingEventHandler',
      context: 'processUpdate',
      message: 'status not changed'
    })
    return
  }
  if (payload.value.status !== 'assigned') {
    logger.debug({
      component: 'ResourceBookingEventHandler',
      context: 'processUpdate',
      message: `not interested resource booking - status: ${payload.value.status}`
    })
    return
  }
  const resourceBooking = await models.ResourceBooking.findById(payload.value.id)
  if (!resourceBooking.jobId) {
    logger.debug({
      component: 'ResourceBookingEventHandler',
      context: 'processUpdate',
      message: `id: ${resourceBooking.id} resource booking without jobId - ignored`
    })
    return
  }
  await selectJobCandidate(resourceBooking.jobId, resourceBooking.userId)
  await assignJob(resourceBooking.jobId)
}

module.exports = {
  processUpdate
}
