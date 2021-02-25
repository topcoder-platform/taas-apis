/*
 * Handle events for ResourceBooking.
 */

const { Op } = require('sequelize')
const _ = require('lodash')
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
  if (_.get(payload, 'options.oldValue') && payload.value.status === payload.options.oldValue.status) {
    logger.debug({
      component: 'ResourceBookingEventHandler',
      context: 'selectJobCandidate',
      message: 'status not changed'
    })
    return
  }
  if (payload.value.status !== 'assigned') {
    logger.debug({
      component: 'ResourceBookingEventHandler',
      context: 'selectJobCandidate',
      message: `not interested resource booking - status: ${payload.value.status}`
    })
    return
  }
  const resourceBooking = await models.ResourceBooking.findById(payload.value.id)
  if (!resourceBooking.jobId) {
    logger.debug({
      component: 'ResourceBookingEventHandler',
      context: 'selectJobCandidate',
      message: `id: ${resourceBooking.id} resource booking without jobId - ignored`
    })
    return
  }
  const candidates = await models.JobCandidate.findAll({
    where: {
      jobId: resourceBooking.jobId,
      userId: resourceBooking.userId,
      status: {
        [Op.not]: 'selected'
      }
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
 * @param {Object} payload the event payload
 * @returns {undefined}
 */
async function assignJob (payload) {
  if (_.get(payload, 'options.oldValue') && payload.value.status === payload.options.oldValue.status) {
    logger.debug({
      component: 'ResourceBookingEventHandler',
      context: 'assignJob',
      message: 'status not changed'
    })
    return
  }
  if (payload.value.status !== 'assigned') {
    logger.debug({
      component: 'ResourceBookingEventHandler',
      context: 'assignJob',
      message: `not interested resource booking - status: ${payload.value.status}`
    })
    return
  }
  const resourceBooking = await models.ResourceBooking.findById(payload.value.id)
  if (!resourceBooking.jobId) {
    logger.debug({
      component: 'ResourceBookingEventHandler',
      context: 'assignJob',
      message: `id: ${resourceBooking.id} resource booking without jobId - ignored`
    })
    return
  }
  const job = await models.Job.findById(resourceBooking.jobId)
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
      status: 'assigned'
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
 * Process resource booking create event.
 *
 * @param {Object} payload the event payload
 * @returns {undefined}
 */
async function processCreate (payload) {
  await selectJobCandidate(payload)
  await assignJob(payload)
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
  processCreate,
  processUpdate
}
