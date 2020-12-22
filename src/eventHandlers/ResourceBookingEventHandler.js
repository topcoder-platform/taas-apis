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
 * @param {Object} payload the event payload
 * @returns {undefined}
 */
async function selectJobCandidate (payload) {
  if (payload.status !== 'assigned') {
    logger.info({
      component: 'ResourceBookingEventHandler',
      context: 'selectJobCandidate',
      message: `not interested resource booking - status: ${payload.status}`
    })
    return
  }
  const candidates = await models.JobCandidate.findAll({
    where: {
      jobId: payload.jobId,
      userId: payload.userId,
      status: {
        [Op.not]: 'selected'
      },
      deletedAt: null
    }
  })
  await Promise.all(candidates.map(candidate => JobCandidateService.partiallyUpdateJobCandidate(
    helper.authUserAsM2M(),
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
 * @param {Object} payload the event payload
 * @returns {undefined}
 */
async function assignJob (payload) {
  if (payload.status !== 'assigned') {
    logger.info({
      component: 'ResourceBookingEventHandler',
      context: 'assignJob',
      message: `not interested resource booking - status: ${payload.status}`
    })
    return
  }
  const job = await models.Job.findOne({
    where: {
      projectId: payload.projectId,
      deletedAt: null
    }
  })
  if (job.status === 'assigned') {
    logger.info({
      component: 'ResourceBookingEventHandler',
      context: 'assignJob',
      message: `job with projectId ${payload.projectId} is already assigned`
    })
    return
  }
  const resourceBookings = await models.ResourceBooking.findAll({
    where: {
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
    await JobService.partiallyUpdateJob(helper.authUserAsM2M(), job.id, { status: 'assigned' })
    logger.info({ component: 'ResourceBookingEventHandler', context: 'assignJob', message: `job with projectId ${payload.projectId} is assigned` })
  }
}

/**
 * Process resource booking update event.
 *
 * @param {Object} payload the event payload
 * @returns {undefined}
 */
async function processUpdate (payload) {
  await selectJobCandidate(payload)
  await assignJob(payload)
}

module.exports = {
  processUpdate
}
