/*
 * Handle events for ResourceBooking.
 */

const { Op } = require('sequelize')
const _ = require('lodash')
const models = require('../models')
const logger = require('../common/logger')
const helper = require('../common/helper')
const JobService = require('../services/JobService')

const Job = models.Job

/**
 * When a Role is deleted, jobs related to
 * that role should be updated
 * @param {object} payload the event payload
 * @returns {undefined}
 */
async function updateJobs (payload) {
  // find jobs have this role
  const jobs = await Job.findAll({
    where: {
      roleIds: { [Op.contains]: [payload.value.id] }
    },
    raw: true
  })
  if (jobs.length === 0) {
    logger.debug({
      component: 'RoleEventHandler',
      context: 'updateJobs',
      message: `id: ${payload.value.id} role has no related job - ignored`
    })
    return
  }
  const m2mUser = helper.getAuditM2Muser()
  // remove role id from related jobs
  await Promise.all(_.map(jobs, async job => {
    let roleIds = _.filter(job.roleIds, roleId => roleId !== payload.value.id)
    if (roleIds.length === 0) {
      roleIds = null
    }
    await JobService.partiallyUpdateJob(m2mUser, job.id, { roleIds })
  }))
  logger.debug({
    component: 'RoleEventHandler',
    context: 'updateJobs',
    message: `role id: ${payload.value.id} removed from jobs with id: ${_.map(jobs, 'id')}`
  })
}

/**
 * Process role delete event.
 *
 * @param {Object} payload the event payload
 * @returns {undefined}
 */
async function processDelete (payload) {
  await updateJobs(payload)
}

module.exports = {
  processDelete
}
