/**
 * This service provides operations of Job.
 */

const _ = require('lodash')
const Joi = require('joi')
const helper = require('../common/helper')
const logger = require('../common/logger')
const JobService = require('./JobService')
const ResourceBookingService = require('./ResourceBookingService')

/**
 * Function to get assigned resource booking
 * @param {String} projectId project id
 * @returns the request result
 */
async function _getAssignedResourceBooking (projectId) {
  const criteria = { status: 'assigned' }
  if (projectId) {
    criteria.projectId = projectId
  }
  const { result } = await ResourceBookingService.searchResourceBookings(criteria)
  return result
}

/**
 * Function to get jobs by projectIds
 * @param {Array} projectIds project ids
 * @returns the request result
 */
async function _getJobsByProjectIds (projectIds) {
  const { result } = await JobService.searchJobs({ projectIds })
  return result
}

/**
 * List teams
 * @param {Object} currentUser the user who perform this operation
 * @returns {Object} the search result, contain total/page/perPage and result array
 */
async function searchTeams (currentUser) {
  // Get projects from /v5/projects
  const projects = await helper.getProjects(currentUser.jwtToken)

  return await getTeamDetail(currentUser, projects)
}

searchTeams.schema = Joi.object().keys({
  currentUser: Joi.object().required()
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
  // Get users from /v5/users
  const users = await helper.getUsers(currentUser.jwtToken)
  // Get resourceBookings from taas api
  const resourceBookings = await _getAssignedResourceBooking(currentUser.jwtToken)
  // Get jobs from taas api
  const jobs = await _getJobsByProjectIds(projectIds)

  // Get first week day and last week day
  const curr = new Date()
  curr.setHours(0, 0, 0, 0)
  const first = curr.getDate() - curr.getDay()
  const last = first + 6

  const firstDay = new Date(curr.setDate(first))
  const lastDay = new Date(curr.setDate(last))

  const result = []
  for (const project of projects) {
    const rbs = _.filter(resourceBookings, { projectId: project.id })
    const res = _.clone(project)
    res.weeklyCount = 0
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
        const startDate = new Date(item.startDate)
        const endDate = new Date(item.endDate)

        if ((!item.startDate || (startDate <= firstDay && startDate < lastDay)) &&
          (!item.endDate || (endDate >= lastDay && endDate > firstDay))) {
          res.weeklyCount += item.customerRate
        }
      }

      const userIds = _.map(rbs, 'userId')
      const userInfos = _.filter(users, item => {
        return userIds.indexOf(item.id) > -1
      })
      if (userInfos && userInfos.length > 0) {
        res.resources = userInfos

        const userHandles = _.map(userInfos, 'handle')
        // Get user photo from /v5/members
        const members = await helper.getMembers(currentUser.jwtToken, userHandles)

        for (const item of res.resources) {
          const findMember = _.find(members, { handleLower: item.handle.toLowerCase() })
          if (findMember && findMember.photoURL) {
            item.photo_url = findMember.photoURL
          }

          if (!isSearch) {
            // If call function is not search, add job field
            const findRbs = _.find(rbs, { userId: item.id })
            if (findRbs) {
              item.customerRate = findRbs.customerRate
              const job = _.find(jobs, { id: findRbs.jobId })
              if (job) {
                item.job = {
                  id: job.id,
                  name: job.description
                }
              }
            }
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
  // Get users from /v5/projects
  const project = await helper.getProjectById(currentUser.jwtToken, id)

  const result = await getTeamDetail(currentUser, [project], false)
  // Get users from /v5/skills
  const skills = await helper.getSkills(currentUser.jwtToken)

  const teamDetail = result[0]

  // add job skills for result
  let jobSkills = []
  if (teamDetail && teamDetail.jobs) {
    for (const job of teamDetail.jobs) {
      if (job.skills) {
        jobSkills = _.map(job.skills, skill => {
          return _.find(skills, item => {
            return item.id === skill
          })
        })
        job.skills = jobSkills
      }
    }
  }

  // add resources skills for result
  if (teamDetail && teamDetail.resources) {
    for (const user of teamDetail.resources) {
      const userSkills = await helper.getUserSkill(currentUser.jwtToken, user.id)
      user.skills = userSkills

      user.skillMatched = 0
      if (userSkills && userSkills.length > 0) {
        for (const jobSkill of jobSkills) {
          if (_.find(userSkills, userSkill => {
            return userSkill.id === jobSkill.id
          })) {
            user.skillMatched += 1
          }
        }
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
  // Get jobs from taas api
  const jobs = await _getJobsByProjectIds([id])
  const job = _.find(jobs, { id: jobId })

  if (!job) {
    logger.debug({ component: 'TeamService', context: 'getTeamJob', message: `id ${jobId}: "Job" with Team id ${id} is not exist` })
    return {}
  }
  const result = {
    id: job.id,
    description: job.description
  }

  const jobSkills = job.skills

  if (job && job.candidates && job.candidates.length > 0) {
    // Get job candidates from /v5/users
    const users = await helper.getUsers(currentUser.jwtToken)
    const userIds = _.map(job.candidates, 'userId')
    const candidates = _.filter(users, item => {
      return userIds.indexOf(item.id) > -1
    })

    const userHandles = _.map(candidates, 'handle')
    if (userHandles && userHandles.length > 0) {
      // Get user photo from /v5/members
      const members = await helper.getMembers(currentUser.jwtToken, userHandles)

      for (const item of candidates) {
        item.resumeLink = null
        const candidate = _.find(job.candidates, { userId: item.id })
        if (candidate) {
          item.status = candidate.status
        }
        const findMember = _.find(members, { handleLower: item.handle.toLowerCase() })
        if (findMember && findMember.photoURL) {
          item.photo_url = findMember.photoURL
        }

        // Get user skill details from /v5/user/:id/skills
        const userSkills = await helper.getUserSkill(currentUser.jwtToken, item.id)
        item.skills = userSkills

        item.skillMatched = 0
        if (userSkills && userSkills.length > 0) {
          for (const jobSkillId of jobSkills) {
            if (_.find(userSkills, userSkill => {
              return userSkill.id === jobSkillId
            })) {
              item.skillMatched += 1
            }
          }
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
