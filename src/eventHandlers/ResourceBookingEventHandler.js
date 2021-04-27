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
const WorkPeriodService = require('../services/WorkPeriodService')
const WorkPeriod = models.WorkPeriod

/**
 * When ResourceBooking's status is changed to `placed`
 * the corresponding JobCandidate record (with the same userId and jobId)
 * should be updated with status `placed`
 *
 * @param {Object} payload the event payload
 * @returns {undefined}
 */
async function placeJobCandidate (payload) {
  if (_.get(payload, 'options.oldValue') && payload.value.status === payload.options.oldValue.status) {
    logger.debug({
      component: 'ResourceBookingEventHandler',
      context: 'placeJobCandidate',
      message: 'status not changed'
    })
    return
  }
  if (payload.value.status !== 'placed') {
    logger.debug({
      component: 'ResourceBookingEventHandler',
      context: 'placeJobCandidate',
      message: `not interested resource booking - status: ${payload.value.status}`
    })
    return
  }
  const resourceBooking = await models.ResourceBooking.findById(payload.value.id)
  if (!resourceBooking.jobId) {
    logger.debug({
      component: 'ResourceBookingEventHandler',
      context: 'placeJobCandidate',
      message: `id: ${resourceBooking.id} resource booking without jobId - ignored`
    })
    return
  }
  const candidates = await models.JobCandidate.findAll({
    where: {
      jobId: resourceBooking.jobId,
      userId: resourceBooking.userId,
      status: {
        [Op.not]: 'placed'
      }
    }
  })
  await Promise.all(candidates.map(candidate => JobCandidateService.partiallyUpdateJobCandidate(
    helper.getAuditM2Muser(),
    candidate.id,
    { status: 'placed' }
  ).then(result => {
    logger.info({
      component: 'ResourceBookingEventHandler',
      context: 'placeJobCandidate',
      message: `id: ${result.id} candidate got selected.`
    })
  })))
}

/**
 * Update the status of the Job to placed when it positions requirement is fullfilled.
 *
 * @param {Object} payload the event payload
 * @returns {undefined}
 */
async function placeJob (payload) {
  if (_.get(payload, 'options.oldValue') && payload.value.status === payload.options.oldValue.status) {
    logger.debug({
      component: 'ResourceBookingEventHandler',
      context: 'placeJob',
      message: 'status not changed'
    })
    return
  }
  if (payload.value.status !== 'placed') {
    logger.debug({
      component: 'ResourceBookingEventHandler',
      context: 'placeJob',
      message: `not interested resource booking - status: ${payload.value.status}`
    })
    return
  }
  const resourceBooking = await models.ResourceBooking.findById(payload.value.id)
  if (!resourceBooking.jobId) {
    logger.debug({
      component: 'ResourceBookingEventHandler',
      context: 'placeJob',
      message: `id: ${resourceBooking.id} resource booking without jobId - ignored`
    })
    return
  }
  const job = await models.Job.findById(resourceBooking.jobId)
  if (job.status === 'placed') {
    logger.debug({
      component: 'ResourceBookingEventHandler',
      context: 'placeJob',
      message: `job with projectId ${job.projectId} is already placed`
    })
    return
  }
  const resourceBookings = await models.ResourceBooking.findAll({
    where: {
      jobId: job.id,
      status: 'placed'
    }
  })
  logger.debug({
    component: 'ResourceBookingEventHandler',
    context: 'placeJob',
    message: `the number of placed resource bookings is ${resourceBookings.length} - the numPositions of the job is ${job.numPositions}`
  })
  if (job.numPositions === resourceBookings.length) {
    await JobService.partiallyUpdateJob(helper.getAuditM2Muser(), job.id, { status: 'placed' })
    logger.info({ component: 'ResourceBookingEventHandler', context: 'placeJob', message: `job ${job.id} is placed` })
  }
}

/**
 * When a ResourceBooking is created, workPeriods that cover each weeks
 * of resource booking should be also created
 * @param {object} payload the event payload
 * @returns {undefined}
 */
async function createWorkPeriods (payload) {
  // if startDate or endDate is not provided then we can't create work period
  if (_.isNil(payload.value.startDate) || _.isNil(payload.value.endDate)) {
    logger.debug({
      component: 'ResourceBookingEventHandler',
      context: 'createWorkPeriods',
      message: `id: ${payload.value.id} resource booking without endDate or startDate - ignored`
    })
    return
  }
  // collect dates of work periods
  const workPeriodDates = helper.extractWorkPeriods(payload.value.startDate, payload.value.endDate)
  await _createWorkPeriods(workPeriodDates, payload.value.id)
  logger.debug({
    component: 'ResourceBookingEventHandler',
    context: 'createWorkPeriods',
    message: `WorkPeriods created for resource booking with id: ${payload.value.id}`
  })
}

/**
 * When a ResourceBooking is updated, workPeriods related to
 * that ResourceBooking should be updated also.
 * This function finds aout which workPeriods should be deleted,
 * which ones should be created and which ones should be updated
 * @param {object} payload the event payload
 * @returns {undefined}
 */
async function updateWorkPeriods (payload) {
  // find related workPeriods to evaluate the changes
  const workPeriods = await WorkPeriod.findAll({
    where: {
      resourceBookingId: payload.value.id
    },
    raw: true
  })
  // gather workPeriod dates
  const newWorkPeriods = helper.extractWorkPeriods(payload.value.startDate || payload.options.oldValue.startDate, payload.value.endDate || payload.options.oldValue.endDate)
  // find which workPeriods should be removed
  const workPeriodsToRemove = _.differenceBy(workPeriods, newWorkPeriods, 'startDate')
  // find which workperiods should be created
  const workPeriodsToAdd = _.differenceBy(newWorkPeriods, workPeriods, 'startDate')
  // find which workperiods' daysWorked propery should be updated
  let workPeriodsToUpdate = _.intersectionBy(newWorkPeriods, workPeriods, 'startDate')
  workPeriodsToUpdate = _.differenceWith(workPeriodsToUpdate, workPeriods, (a, b) => b.startDate === a.startDate && b.daysWorked === a.daysWorked)
  // include id
  workPeriodsToUpdate = _.map(workPeriodsToUpdate, wpu => {
    wpu.id = _.filter(workPeriods, ['startDate', wpu.startDate])[0].id
    return wpu
  })
  if (workPeriodsToRemove.length === 0 && workPeriodsToAdd.length === 0 && workPeriodsToUpdate.length === 0) {
    logger.debug({
      component: 'ResourceBookingEventHandler',
      context: 'updateWorkPeriods',
      message: `id: ${payload.value.id} resource booking has no change in dates - ignored`
    })
    return
  }
  if (workPeriodsToRemove.length > 0) {
    await _deleteWorkPeriods(workPeriodsToRemove)
    logger.debug({
      component: 'ResourceBookingEventHandler',
      context: 'updateWorkPeriods',
      message: `Old WorkPeriods deleted for resource booking with id: ${payload.value.id}`
    })
  }
  if (workPeriodsToAdd.length > 0) {
    await _createWorkPeriods(workPeriodsToAdd, payload.value.id)
    logger.debug({
      component: 'ResourceBookingEventHandler',
      context: 'updateWorkPeriods',
      message: `New WorkPeriods created for resource booking with id: ${payload.value.id}`
    })
  }
  if (workPeriodsToUpdate.length > 0) {
    await _updateWorkPeriods(workPeriodsToUpdate)
    logger.debug({
      component: 'ResourceBookingEventHandler',
      context: 'updateWorkPeriods',
      message: `WorkPeriods updated for resource booking with id: ${payload.value.id}`
    })
  }
}

/**
 * When a ResourceBooking is deleted, workPeriods related to
 * that ResourceBooking should also be deleted
 * @param {object} payload the event payload
 * @returns {undefined}
 */
async function deleteWorkPeriods (payload) {
  // find related workPeriods to delete
  const workPeriods = await WorkPeriod.findAll({
    where: {
      resourceBookingId: payload.value.id
    },
    raw: true
  })
  if (workPeriods.length === 0) {
    logger.debug({
      component: 'ResourceBookingEventHandler',
      context: 'deleteWorkPeriods',
      message: `id: ${payload.value.id} resource booking has no workPeriods - ignored`
    })
    return
  }
  await _deleteWorkPeriods(workPeriods)
  logger.debug({
    component: 'ResourceBookingEventHandler',
    context: 'deleteWorkPeriods',
    message: `WorkPeriods deleted for resource booking with id: ${payload.value.id}`
  })
}

/**
 * Calls WorkPeriodService to create workPeriods
 * @param {Array<{startDate:Date,
 * endDate:Date, daysWorked:number}>} periods work period data
 * @param {string} resourceBookingId resourceBookingId of work period
 * @returns {undefined}
 */
async function _createWorkPeriods (periods, resourceBookingId) {
  await Promise.all(_.map(periods, async period => await WorkPeriodService.createWorkPeriod(helper.getAuditM2Muser(),
    {
      resourceBookingId: resourceBookingId,
      startDate: period.startDate,
      endDate: period.endDate,
      daysWorked: period.daysWorked,
      paymentStatus: 'pending'
    })))
}

/**
 * Calls WorkPeriodService to update workPeriods
 * @param {Array<{daysWorked:number}>} periods work period data
 * @returns {undefined}
 */
async function _updateWorkPeriods (periods) {
  await Promise.all(_.map(periods, async period => await WorkPeriodService.partiallyUpdateWorkPeriod(helper.getAuditM2Muser(),
    period.id,
    {
      daysWorked: period.daysWorked
    })))
}

/**
 * Calls WorkPeriodService to delete workPeriods
 * @param {Array<{id:string}>} workPeriods work period objects
 * @returns {undefined}
 */
async function _deleteWorkPeriods (workPeriods) {
  await Promise.all(_.map(workPeriods,
    async workPeriod => await WorkPeriodService.deleteWorkPeriod(helper.getAuditM2Muser(), workPeriod.id)))
}

/**
 * Process resource booking create event.
 *
 * @param {Object} payload the event payload
 * @returns {undefined}
 */
async function processCreate (payload) {
  await placeJobCandidate(payload)
  await placeJob(payload)
  await createWorkPeriods(payload)
}

/**
 * Process resource booking update event.
 *
 * @param {Object} payload the event payload
 * @returns {undefined}
 */
async function processUpdate (payload) {
  await placeJobCandidate(payload)
  await placeJob(payload)
  await updateWorkPeriods(payload)
}

/**
 * Process resource booking delete event.
 *
 * @param {Object} payload the event payload
 * @returns {undefined}
 */
async function processDelete (payload) {
  await deleteWorkPeriods(payload)
}

module.exports = {
  processCreate,
  processUpdate,
  processDelete
}
