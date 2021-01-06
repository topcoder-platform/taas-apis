/**
 * This service provides operations of Job.
 */

const _ = require('lodash')
const Joi = require('joi')
const dateFNS = require('date-fns')
const helper = require('../common/helper')
const logger = require('../common/logger')
const errors = require('../common/errors')
const JobService = require('./JobService')
const ResourceBookingService = require('./ResourceBookingService')

/**
 * Function to get assigned resource bookings with specific projectIds
 * @param {Object} currentUser the user who perform this operation.
 * @param {Array} projectIds project ids
 * @returns the request result
 */
async function _getAssignedResourceBookingsByProjectIds (currentUser, projectIds) {
  const criteria = { status: 'assigned', projectIds }
  const { result } = await ResourceBookingService.searchResourceBookings(currentUser, criteria, { returnAll: true })
  return result
}

/**
 * Function to get jobs by projectIds
 * @param {Object} currentUser the user who perform this operation.
 * @param {Array} projectIds project ids
 * @returns the request result
 */
async function _getJobsByProjectIds (currentUser, projectIds) {
  const { result } = await JobService.searchJobs(currentUser, { projectIds }, { returnAll: true })
  return result
}

/**
 * List teams
 * @param {Object} currentUser the user who perform this operation
 * @param {Object} criteria the search criteria
 * @returns {Object} the search result, contain total/page/perPage and result array
 */
async function searchTeams (currentUser, criteria) {
  const sort = `${criteria.sortBy} ${criteria.sortOrder}`
  // Get projects from /v5/projects with searching criteria
  const { total, page, perPage, result: projects } = await helper.getProjects(
    currentUser,
    {
      page: criteria.page,
      perPage: criteria.perPage,
      name: criteria.name,
      sort
    }
  )
  return {
    total,
    page,
    perPage,
    result: await getTeamDetail(currentUser, projects)
  }
}

searchTeams.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  criteria: Joi.object().keys({
    page: Joi.page(),
    perPage: Joi.perPage(),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'lastActivityAt', 'id', 'status', 'name', 'type', 'best match').default('lastActivityAt'),
    sortOrder: Joi.when('sortBy', {
      is: 'best match',
      then: Joi.forbidden().label('sortOrder(with sortBy being `best match`)'),
      otherwise: Joi.string().valid('asc', 'desc').default('desc')
    }),
    name: Joi.string()
  }).required()
}).required()

/**
 * Get team details
 * @param {Object} currentUser the user who perform this operation
 * @param {Object} projects the projects
 * @param {Object} isSearch the flag whether for search function
 * @returns {Object} the search result
 */
async function getTeamDetail (currentUser, projects, isSearch = true) {
  const projectIds = _.map(projects, 'id')
  // Get all assigned resourceBookings filtered by projectIds
  const resourceBookings = await _getAssignedResourceBookingsByProjectIds(currentUser, projectIds)
  // Get all jobs filtered by projectIds
  const jobs = await _getJobsByProjectIds(currentUser, projectIds)

  // Get first week day and last week day
  const curr = new Date()
  const firstDay = dateFNS.startOfWeek(curr)
  const lastDay = dateFNS.endOfWeek(curr)

  logger.debug({ component: 'TeamService', context: 'getTeamDetail', message: `week started: ${firstDay}, week ended: ${lastDay}` })

  const result = []
  for (const project of projects) {
    const rbs = _.filter(resourceBookings, { projectId: project.id })
    const res = _.clone(project)
    res.weeklyCost = 0
    res.resources = []

    if (rbs && rbs.length > 0) {
      // Get minimal start date and maximal end date
      const startDates = []
      const endDates = []
      for (const rbsItem of rbs) {
        if (rbsItem.startDate) {
          startDates.push(new Date(rbsItem.startDate))
        }
        if (rbsItem.endDate) {
          endDates.push(new Date(rbsItem.endDate))
        }
      }

      if (startDates && startDates.length > 0) {
        res.startDate = _.min(startDates)
      }
      if (endDates && endDates.length > 0) {
        res.endDate = _.max(endDates)
      }

      // Count weekly rate
      for (const item of rbs) {
        // ignore any resourceBooking that has customerRate missed
        if (!item.customerRate) {
          continue
        }
        const startDate = new Date(item.startDate)
        const endDate = new Date(item.endDate)

        // normally startDate is smaller than endDate for a resourceBooking so not check if startDate < endDate
        if ((!item.startDate || startDate < lastDay) &&
          (!item.endDate || endDate > firstDay)) {
          res.weeklyCost += item.customerRate
        }
      }

      const usersPromises = []
      _.map(rbs, (rb) => {
        usersPromises.push(
          helper.getUserById(rb.userId, true)
            .then(user => {
              // If call function is not search, add jobId field
              if (!isSearch) {
                user.jobId = rb.jobId
                user.customerRate = rb.customerRate
                user.startDate = rb.startDate
                user.endDate = rb.endDate
              }
              return user
            })
        )
      })
      const userInfos = await Promise.all(usersPromises)
      if (userInfos && userInfos.length > 0) {
        res.resources = userInfos

        const userHandles = _.map(userInfos, 'handle')
        // Get user photo from /v5/members
        const members = await helper.getMembers(userHandles)

        for (const item of res.resources) {
          const findMember = _.find(members, { handleLower: item.handle.toLowerCase() })
          if (findMember && findMember.photoURL) {
            item.photo_url = findMember.photoURL
          }
        }
      }
    }

    const jobsTmp = _.filter(jobs, { projectId: project.id })
    if (jobsTmp && jobsTmp.length > 0) {
      if (isSearch) {
        // Count total positions
        res.totalPositions = 0
        for (const item of jobsTmp) {
          // only sum numPositions of jobs whose status is NOT cancelled or closed
          if (['cancelled', 'closed'].includes(item.status)) {
            continue
          }
          res.totalPositions += item.numPositions
        }
      } else {
        res.jobs = _.map(jobsTmp, job => {
          return _.pick(job, ['id', 'description', 'startDate', 'endDate', 'numPositions', 'rateType', 'skills', 'customerRate', 'status'])
        })
      }
    }
    result.push(res)
  }

  return result
}

/**
 * Get team by id
 * @param {Object} currentUser the user who perform this operation
 * @param {String} id the job id
 * @returns {Object} the team
 */
async function getTeam (currentUser, id) {
  const project = await helper.getProjectById(currentUser, id)
  const result = await getTeamDetail(currentUser, [project], false)
  const teamDetail = result[0]

  // add job skills for result
  let jobSkills = []
  if (teamDetail && teamDetail.jobs) {
    for (const job of teamDetail.jobs) {
      if (job.skills) {
        const usersPromises = []
        _.map(job.skills, (skillId) => { usersPromises.push(helper.getSkillById(skillId)) })
        jobSkills = await Promise.all(usersPromises)
        job.skills = jobSkills
      }
    }
  }

  return teamDetail
}

getTeam.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  id: Joi.number().integer().required()
}).required()

/**
 * Get team job with id
 * @param {Object} currentUser the user who perform this operation
 * @param {String} id the team id
 * @param {String} jobId the job id
 * @returns the team job
 */
async function getTeamJob (currentUser, id, jobId) {
  const project = await helper.getProjectById(currentUser, id)
  const jobs = await _getJobsByProjectIds(currentUser, [project.id])
  const job = _.find(jobs, { id: jobId })

  if (!job) {
    throw new errors.NotFoundError(`id: ${jobId} "Job" with Team id ${id} doesn't exist`)
  }
  const result = {
    id: job.id,
    description: job.description
  }

  if (job.skills) {
    result.skills = await Promise.all(
      _.map(job.skills, (skillId) => helper.getSkillById(skillId))
    )
  }

  if (job && job.candidates && job.candidates.length > 0) {
    const usersPromises = []
    _.map(job.candidates, (candidate) => { usersPromises.push(helper.getUserById(candidate.userId, true)) })
    const candidates = await Promise.all(usersPromises)

    const userHandles = _.map(candidates, 'handle')
    if (userHandles && userHandles.length > 0) {
      // Get user photo from /v5/members
      const members = await helper.getMembers(userHandles)

      for (const item of candidates) {
        item.resumeLink = null
        const candidate = _.find(job.candidates, { userId: item.id })
        // TODO this logic should be vice-verse, we should loop trough candidates and populate users data if found,
        //      not loop through users and populate candidates data if found
        if (candidate) {
          item.status = candidate.status
          // return User id as `userId` and JobCandidate id as `id`
          item.userId = item.id
          item.id = candidate.id
        }
        const findMember = _.find(members, { handleLower: item.handle.toLowerCase() })
        if (findMember && findMember.photoURL) {
          item.photo_url = findMember.photoURL
        }
      }
    }

    result.candidates = candidates
  }

  return result
}

getTeamJob.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  id: Joi.number().integer().required(),
  jobId: Joi.string().guid().required()
}).required()

module.exports = {
  searchTeams,
  getTeam,
  getTeamJob
}
