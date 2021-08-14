/**
 * This service provides operations of Job.
 */

const _ = require('lodash')
const Joi = require('joi')
const dateFNS = require('date-fns')
const config = require('config')
const helper = require('../common/helper')
const logger = require('../common/logger')
const errors = require('../common/errors')
const eventDispatcher = require('../common/eventDispatcher')
const JobService = require('./JobService')
const ResourceBookingService = require('./ResourceBookingService')
const HttpStatus = require('http-status-codes')
const { Op } = require('sequelize')
const models = require('../models')
const stopWords = require('../../data/stopWords.json')
const { getAuditM2Muser } = require('../common/helper')
const { matchedSkills, unMatchedSkills } = require('../../scripts/emsi-mapping/esmi-skills-mapping')
const Role = models.Role
const RoleSearchRequest = models.RoleSearchRequest
const stripe = require('stripe')(config.STRIPE_SECRET_KEY, { maxNetworkRetries: 5 })

const emailTemplates = helper.getEmailTemplatesForKey('teamTemplates')

/**
 * Function to get placed resource bookings with specific projectIds
 * @param {Object} currentUser the user who perform this operation.
 * @param {Array} projectIds project ids
 * @returns the request result
 */
async function _getPlacedResourceBookingsByProjectIds (currentUser, projectIds) {
  const criteria = { status: 'placed', projectIds }
  const { result } = await ResourceBookingService.searchResourceBookings(
    currentUser,
    criteria,
    { returnAll: true }
  )
  return result
}

/**
 * Function to get jobs by projectIds
 * @param {Object} currentUser the user who perform this operation.
 * @param {Array} projectIds project ids
 * @returns the request result
 */
async function _getJobsByProjectIds (currentUser, projectIds) {
  const { result } = await JobService.searchJobs(
    currentUser,
    { projectIds },
    { returnAll: true }
  )
  return result
}

/**
 * compiled regex patters according to Levenshtein distance <=1 for unmatched skills from EMSI
 * @returns {Array} the unMatched skills with regex pattern
 */
function compileRegexPatternForNoEmsiSkills () {
  const unMatched = []
  // store skill names and compiled regex paterns
  _.each(unMatchedSkills, skill => {
    unMatched.push({
      name: skill.toLowerCase(),
      pattern: _compileRegexPatternForSkillName(skill.toLowerCase())
    })
  })
  return unMatched
}

/**
 * Prepares the regex pattern for the given word
 * according to Levenshtein distance of 1 (insertions, deletions or substitutions)
 * @param {String} skillName the name of the skill
 * @returns {RegExp} the compiled regex pattern
 */
function _compileRegexPatternForSkillName (skillName) {
  // split the name into its chars
  let chars = _.split(skillName, '')
  // escape characters reserved to regex
  chars = _.map(chars, _.escapeRegExp)
  // Its not a good idea to apply tolerance according to
  // Levenshtein distance for the words have less than 3 letters
  // We expect the skill names have 1 or 2 letters to take place
  // in job description as how they are exactly spelled
  if (chars.length < 3) {
    return new RegExp(`^(?:${_.join(chars, '')})$`, 'i')
  }

  const res = []
  // include the skill name itself
  res.push(_.join(chars, ''))
  // include every transposition combination
  // E.g. java => ajva, jvaa, jaav
  for (let i = 0; i < chars.length - 1; i++) {
    res.push(_.join(_.slice(chars, 0, i), '') + chars[i + 1] + chars[i] + _.join(_.slice(chars, i + 2), ''))
  }
  // include every insertion combination
  // E.g. java => .java, j.ava, ja.va, jav.a, java.
  for (let i = 0; i <= chars.length; i++) {
    res.push(_.join(_.slice(chars, 0, i), '') + '.' + _.join(_.slice(chars, i), ''))
  }
  // include every deletion/substitution combination
  // E.g. java => .?ava, j.?va, ja.?a, jav.?
  for (let i = 0; i < chars.length; i++) {
    res.push(_.join(_.slice(chars, 0, i), '') + '.?' + _.join(_.slice(chars, i + 1), ''))
  }
  // return the regex pattern
  return new RegExp(`^(?:${_.join(res, '|')})$`, 'i')
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
  const {
    total,
    page,
    perPage,
    result: projects
  } = await helper.getProjects(currentUser, {
    page: criteria.page,
    perPage: criteria.perPage,
    name: criteria.name,
    sort
  })
  return {
    total,
    page,
    perPage,
    result: await getTeamDetail(currentUser, projects)
  }
}

searchTeams.schema = Joi.object()
  .keys({
    currentUser: Joi.object().required(),
    criteria: Joi.object()
      .keys({
        page: Joi.page(),
        perPage: Joi.perPage(),
        sortBy: Joi.string()
          .valid(
            'createdAt',
            'updatedAt',
            'lastActivityAt',
            'id',
            'status',
            'name',
            'type',
            'best match'
          )
          .default('lastActivityAt'),
        sortOrder: Joi.when('sortBy', {
          is: 'best match',
          then: Joi.forbidden().label(
            'sortOrder(with sortBy being `best match`)'
          ),
          otherwise: Joi.string().valid('asc', 'desc').default('desc')
        }),
        name: Joi.string()
      })
      .required()
  })
  .required()

/**
 * Get team details
 * @param {Object} currentUser the user who perform this operation
 * @param {Object} projects the projects
 * @param {Object} isSearch the flag whether for search function
 * @returns {Object} the search result
 */
async function getTeamDetail (currentUser, projects, isSearch = true) {
  const projectIds = _.map(projects, 'id')
  // Get all placed resourceBookings filtered by projectIds
  const resourceBookings = await _getPlacedResourceBookingsByProjectIds(
    currentUser,
    projectIds
  )
  // Get all jobs filtered by projectIds
  const jobs = await _getJobsByProjectIds(currentUser, projectIds)

  // Get first week day and last week day
  const curr = new Date()
  const firstDay = dateFNS.startOfWeek(curr)
  const lastDay = dateFNS.endOfWeek(curr)

  logger.debug({
    component: 'TeamService',
    context: 'getTeamDetail',
    message: `week started: ${firstDay}, week ended: ${lastDay}`
  })

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
        if (
          (!item.startDate || startDate < lastDay) &&
          (!item.endDate || endDate > firstDay)
        ) {
          res.weeklyCost += item.customerRate
        }
      }

      const resourceInfos = await Promise.all(
        _.map(rbs, (rb) => {
          return helper.getUserById(rb.userId, true).then((user) => {
            const resource = {
              id: rb.id,
              userId: user.id,
              ..._.pick(user, ['handle', 'firstName', 'lastName', 'skills'])
            }
            // If call function is not search, add jobId field
            if (!isSearch) {
              resource.jobId = rb.jobId
              resource.customerRate = rb.customerRate
              resource.startDate = rb.startDate
              resource.endDate = rb.endDate
            }
            return resource
          })
        })
      )
      if (resourceInfos && resourceInfos.length > 0) {
        res.resources = resourceInfos

        const userHandles = _.map(resourceInfos, 'handle')
        // Get user photo from /v5/members
        const members = await helper.getMembers(userHandles)

        for (const item of res.resources) {
          const findMember = _.find(members, {
            handleLower: item.handle.toLowerCase()
          })
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
        res.jobs = _.map(jobsTmp, (job) => {
          return _.pick(job, [
            'id',
            'description',
            'startDate',
            'duration',
            'numPositions',
            'rateType',
            'skills',
            'customerRate',
            'status',
            'title'
          ])
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
        _.map(job.skills, (skillId) => {
          usersPromises.push(helper.getSkillById(skillId))
        })
        jobSkills = await Promise.all(usersPromises)
        job.skills = jobSkills
      }
    }
  }

  return teamDetail
}

getTeam.schema = Joi.object()
  .keys({
    currentUser: Joi.object().required(),
    id: Joi.number().integer().required()
  })
  .required()

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
    throw new errors.NotFoundError(
      `id: ${jobId} "Job" with Team id ${id} doesn't exist`
    )
  }
  const result = {
    id: job.id,
    title: job.title
  }

  if (job.skills) {
    result.skills = await Promise.all(
      _.map(job.skills, (skillId) => helper.getSkillById(skillId))
    )
  }

  // If the job has candidates, the following data for each candidate would be populated:
  //
  // - the `status`, `resume`, `userId` and `id` of the candidate
  // - the `handle`, `firstName` `lastName` and `skills` of the user(from GET /users/:userId) for the candidate
  // - the `photoURL` of the member(from GET /members) for the candidate
  //
  if (job && job.candidates && job.candidates.length > 0) {
    // find user data for candidates
    const users = await Promise.all(
      _.map(_.uniq(_.map(job.candidates, 'userId')), (userId) =>
        helper.getUserById(userId, true)
      )
    )
    const userMap = _.groupBy(users, 'id')

    // find photo URLs for users
    const members = await helper.getMembers(_.map(users, 'handle'))
    const photoURLMap = _.groupBy(members, 'handleLower')

    result.candidates = _.map(job.candidates, (candidate) => {
      const candidateData = _.pick(candidate, [
        'status',
        'resume',
        'userId',
        'interviews',
        'id'
      ])
      const userData = userMap[candidate.userId][0]
      // attach user data to the candidate
      Object.assign(
        candidateData,
        _.pick(userData, ['handle', 'firstName', 'lastName', 'skills'])
      )
      // attach photo URL to the candidate
      const handleLower = userData.handle.toLowerCase()
      if (photoURLMap[handleLower]) {
        candidateData.photo_url = photoURLMap[handleLower][0].photoURL
      }
      return candidateData
    })
  }

  return result
}

getTeamJob.schema = Joi.object()
  .keys({
    currentUser: Joi.object().required(),
    id: Joi.number().integer().required(),
    jobId: Joi.string().guid().required()
  })
  .required()

/**
 * Send email through a particular template
 * @param {Object} currentUser the user who perform this operation
 * @param {Object} data the email object
 * @returns {undefined}
 */
async function sendEmail (currentUser, data) {
  const template = emailTemplates[data.template]
  const dataCC = data.cc || []
  const templateCC = template.cc || []
  const dataRecipients = data.recipients || []
  const templateRecipients = template.recipients || []
  const subjectBody = {
    subject: data.subject || template.subject,
    body: data.body || template.body
  }
  for (const key in subjectBody) {
    subjectBody[key] = await helper.substituteStringByObject(
      subjectBody[key],
      data.data
    )
  }
  const emailData = {
    // override template if coming data already have the 'from' address
    from: data.from || template.from,
    // create a set of uniq. recipients & CCs, from both coming data & template
    recipients: _.uniq([...dataRecipients, ...templateRecipients]),
    cc: _.uniq([...dataCC, ...templateCC]),
    data: { ...data.data, ...subjectBody },
    sendgrid_template_id: template.sendgridTemplateId,
    version: 'v3'
  }
  await helper.postEvent(config.EMAIL_TOPIC, emailData)
}

sendEmail.schema = Joi.object()
  .keys({
    currentUser: Joi.object().required(),
    data: Joi.object()
      .keys({
        template: Joi.string()
          .valid(...Object.keys(emailTemplates))
          .required(),
        data: Joi.object().required(),
        from: Joi.string().email(),
        recipients: Joi.array().items(Joi.string().email()).allow(null),
        cc: Joi.array().items(Joi.string().email()).allow(null)
      })
      .required()
  })
  .required()

/**
 * Add a member to a team as customer.
 *
 * @param {Number} projectId project id
 * @param {String} userId user id
 * @param {String} fields the fields to be returned
 * @returns {Object} the member added
 */
async function _addMemberToProjectAsCustomer (projectId, userId, fields) {
  try {
    const member = await helper.createProjectMember(
      projectId,
      { userId: userId, role: 'customer' },
      { fields }
    )
    return member
  } catch (err) {
    err.message = _.get(err, 'response.body.message') || err.message
    if (err.message && err.message.includes('User already registered')) {
      throw new Error('User is already added')
    }
    logger.error({
      component: 'TeamService',
      context: '_addMemberToProjectAsCustomer',
      message: err.message
    })
    throw err
  }
}

/**
 * Add members to a team by handle or email.
 * @param {Object} currentUser the user who perform this operation
 * @param {String} id the team id
 * @params {Object} criteria the search criteria
 * @param {Object} data the object including members with handle/email to be added
 * @returns {Object} the success/failed added members
 */
async function addMembers (currentUser, id, criteria, data) {
  await helper.getProjectById(currentUser, id) // check whether the user can access the project

  const result = {
    success: [],
    failed: []
  }

  const handles = data.handles || []
  const emails = data.emails || []

  const handleMembers = await helper
    .getMemberDetailsByHandles(handles)
    .then((members) =>
      _.map(members, (member) => ({
        ...member,
        // populate members with lower-cased handle for case insensitive search
        handleLowerCase: member.handle.toLowerCase()
      }))
    )

  const emailMembers = await helper
    .getMemberDetailsByEmails(emails)
    .then((members) =>
      _.map(members, (member) => ({
        ...member,
        // populate members with lower-cased email for case insensitive search
        emailLowerCase: member.email.toLowerCase()
      }))
    )

  await Promise.all([
    Promise.all(
      handles.map((handle) => {
        const memberDetails = _.find(handleMembers, {
          handleLowerCase: handle.toLowerCase()
        })

        if (!memberDetails) {
          result.failed.push({ error: "User doesn't exist", handle })
          return
        }

        return _addMemberToProjectAsCustomer(
          id,
          memberDetails.userId,
          criteria.fields
        )
          .then((member) => {
            // note, that we return `handle` in the same case it was in request
            result.success.push({ ...member, handle })
          })
          .catch((err) => {
            result.failed.push({ error: err.message, handle })
          })
      })
    ),

    Promise.all(
      emails.map((email) => {
        const memberDetails = _.find(emailMembers, {
          emailLowerCase: email.toLowerCase()
        })

        if (!memberDetails) {
          result.failed.push({ error: "User doesn't exist", email })
          return
        }

        return _addMemberToProjectAsCustomer(
          id,
          memberDetails.id,
          criteria.fields
        )
          .then((member) => {
            // note, that we return `email` in the same case it was in request
            result.success.push({ ...member, email })
          })
          .catch((err) => {
            result.failed.push({ error: err.message, email })
          })
      })
    )
  ])

  return result
}

addMembers.schema = Joi.object()
  .keys({
    currentUser: Joi.object().required(),
    id: Joi.number().integer().required(),
    criteria: Joi.object()
      .keys({
        fields: Joi.string()
      })
      .required(),
    data: Joi.object()
      .keys({
        handles: Joi.array().items(Joi.string()),
        emails: Joi.array().items(Joi.string().email())
      })
      .or('handles', 'emails')
      .required()
  })
  .required()

/**
 * Search members in a team.
 * Serves as a proxy endpoint for `GET /projects/{projectId}/members`.
 *
 * @param {Object} currentUser the user who perform this operation.
 * @param {String} id the team id
 * @params {Object} criteria the search criteria
 * @returns {Object} the search result
 */
async function searchMembers (currentUser, id, criteria) {
  const result = await helper.listProjectMembers(currentUser, id, criteria)
  return { result }
}

searchMembers.schema = Joi.object()
  .keys({
    currentUser: Joi.object().required(),
    id: Joi.number().integer().required(),
    criteria: Joi.object()
      .keys({
        role: Joi.string(),
        fields: Joi.string()
      })
      .required()
  })
  .required()

/**
 * Search member invites for a team.
 * Serves as a proxy endpoint for `GET /projects/{projectId}/invites`.
 *
 * @param {Object} currentUser the user who perform this operation.
 * @param {String} id the team id
 * @params {Object} criteria the search criteria
 * @returns {Object} the search result
 */
async function searchInvites (currentUser, id, criteria) {
  const result = await helper.listProjectMemberInvites(
    currentUser,
    id,
    criteria
  )
  return { result }
}

searchInvites.schema = Joi.object()
  .keys({
    currentUser: Joi.object().required(),
    id: Joi.number().integer().required(),
    criteria: Joi.object()
      .keys({
        fields: Joi.string()
      })
      .required()
  })
  .required()

/**
 * Remove a member from a team.
 * Serves as a proxy endpoint for `DELETE /projects/{projectId}/members/{id}`.
 *
 * @param {Object} currentUser the user who perform this operation.
 * @param {String} id the team id
 * @param {String} projectMemberId the id of the project member
 * @returns {undefined}
 */
async function deleteMember (currentUser, id, projectMemberId) {
  await helper.deleteProjectMember(currentUser, id, projectMemberId)
}

deleteMember.schema = Joi.object()
  .keys({
    currentUser: Joi.object().required(),
    id: Joi.number().integer().required(),
    projectMemberId: Joi.number().integer().required()
  })
  .required()

/**
 * Return details about the current user.
 *
 * @param {Object} currentUser the user who perform this operation.
 * @params {Object} criteria the search criteria
 * @returns {Object} the user data for current user
 */
async function getMe (currentUser) {
  return helper.getUserByExternalId(currentUser.userId)
}

getMe.schema = Joi.object()
  .keys({
    currentUser: Joi.object().required()
  })
  .required()

/**
 * Searches roles either by roleId or jobDescription or skills
 * @param {Object} currentUser the user performing the operation.
 * @param {Object} data search request data
 * @returns {Object} the created project
 */
async function roleSearchRequest (currentUser, data) {
  // if currentUser is undefined then set to machine
  if (_.isUndefined(currentUser)) {
    currentUser = getAuditM2Muser()
  }
  let role
  // if roleId is provided then find role with given id.
  if (!_.isUndefined(data.roleId)) {
    role = await Role.findById(data.roleId)
    role = role.toJSON()
    role.matchedSkills = role.listOfSkills
    role.unMatchedSkills = []
    role.skillsMatch = 1
    // if skills is provided then use skills to find role
  } else if (!_.isUndefined(data.skills)) {
    // validate given skillIds and convert them into skill names
    const skills = await getSkillNamesByIds(data.skills)
    // find the best matching role
    role = await getRoleBySkills(skills)
  } else {
    // if only job description is provided, collect skill names from description
    const tags = await getSkillsByJobDescription({ description: data.jobDescription })
    const skills = _.map(tags, 'tag')

    // add skills to roleSearchRequest and get best matching role
    const [skillIds, roleList] = await Promise.all([getSkillIdsByNames(skills), getRoleBySkills(skills)])
    data.skills = skillIds
    role = roleList
  }
  data.roleId = role.id
  // create roleSearchRequest entity with found roleId
  const { id: roleSearchRequestId, jobTitle } = await createRoleSearchRequest(currentUser, data)
  const entity = jobTitle ? { jobTitle, roleSearchRequestId } : { roleSearchRequestId }
  // clean Role
  role = await _cleanRoleDTO(currentUser, role)
  // return Role
  return _.assign(role, entity)
}

roleSearchRequest.schema = Joi.object()
  .keys({
    currentUser: Joi.object(),
    data: Joi.object().keys({
      roleId: Joi.string().uuid(),
      jobDescription: Joi.string().max(100000),
      skills: Joi.array().items(Joi.string().uuid().required()),
      jobTitle: Joi.string().max(100),
      previousRoleSearchRequestId: Joi.string().uuid()
    }).required().or('roleId', 'jobDescription', 'skills')
  }).required()

/**
 * Returns 1 role most relevant to the specified skills
 * @param {Array<string>} skills the array of skill names
 * @returns {Role} the best matching Role
 */
async function getRoleBySkills (skills) {
  // find all roles which includes any of the given skills
  const queryCriteria = {
    where: { listOfSkills: { [Op.overlap]: skills } },
    raw: true
  }
  const roles = await Role.findAll(queryCriteria)
  if (roles.length > 0) {
    let result = _.each(roles, role => {
      // role matched skills list
      role.matchedSkills = _.intersection(role.listOfSkills, skills)
      role.unMatchedSkills = _.difference(skills, role.matchedSkills)
      // calculate each found roles matching rate
      role.skillsMatch = role.matchedSkills.length / skills.length
      // each role can have multiple rates, get the maximum of global rates
      role.maxGlobal = _.maxBy(role.rates, 'global').global
    })
    // sort roles by skillsMatch, global rate and name
    result = _.orderBy(result, ['skillsMatch', 'maxGlobal', 'name'], ['desc', 'desc', 'asc'])
    if (result[0].skillsMatch >= config.ROLE_MATCHING_RATE) {
      // return the 1st role
      return _.omit(result[0], ['maxGlobal'])
    }
  }
  // if no matching role found then return Custom role or empty object
  return await Role.findOne({ where: { name: { [Op.iLike]: 'Custom' } }, raw: true }) || {}
}

getRoleBySkills.schema = Joi.object()
  .keys({
    skills: Joi.array().items(Joi.string().required()).required()
  }).required()

/**
 * Return skills by job description from EMSI.
 *
 * @param {Object} currentUser the user who perform this operation.
 * @param {Object} data the search criteria
 * @returns {Object} the result
 */
async function getSkillsByJobDescription (data) {
  // replace markdown tags with spaces
  const description = helper.removeTextFormatting(data.description)
  // get skill from emsi
  const emsiTags = await helper.getTags(description)
  // extract words from description
  let words = _.split(description, ' ')
  // remove stopwords from description
  words = _.filter(words, word => stopWords.indexOf(word.toLowerCase()) === -1)
  // include consecutive two word combinations
  const twoWords = []
  for (let i = 0; i < words.length - 1; i++) {
    twoWords.push(`${words[i]} ${words[i + 1]}`)
  }
  words = _.concat(words, twoWords)
  let foundSkills = []
  // add emsi parsed skills
  _.each(emsiTags, (t) => {
    if (matchedSkills[t.tag]) {
      foundSkills.push(matchedSkills[t.tag])
    }
  })

  // unmatctched skill
  const unMatchedTopcoderSkills = compileRegexPatternForNoEmsiSkills()
  const result = []
  // try to match each word with skill names
  // using pre-compiled regex pattern
  _.each(words, word => {
    _.each(unMatchedTopcoderSkills, skill => {
      // do not stop searching after a match in order to detect more lookalikes
      if (skill.pattern.test(word)) {
        foundSkills.push(skill.name)
      }
      // for suffix with 'js'
      if (!word.endsWith('js') && skill.name.endsWith('js')) {
        if (skill.pattern.test(word + 'js')) {
          foundSkills.push(skill.name)
        }
      }
    })
  })
  foundSkills = _.uniq(foundSkills)
  const skillIds = await getSkillIdsByNames(foundSkills)
  // apply desired template
  _.each(foundSkills, (skillTag, idx) => {
    result.push({
      id: skillIds[idx],
      tag: skillTag,
      type: 'taas_skill',
      source: 'taas-jd-parser'
    })
  })

  return result
}

getSkillsByJobDescription.schema = Joi.object()
  .keys({
    data: Joi.object().keys({
      description: Joi.string().required()
    }).required()
  }).required()

/**
 * Validate given skillIds and return their names
 *
 * @param {Array<string>} skills the array of skill ids
 * @returns {Array<string>} the array of skill names
 */
async function getSkillNamesByIds (skills) {
  const responses = await Promise.all(
    skills.map(
      skill => helper.getSkillById(skill)
        .then((skill) => {
          return _.assign(skill, { found: true })
        })
        .catch(err => {
          if (err.status !== HttpStatus.NOT_FOUND) {
            throw err
          }
          return { found: false, skill }
        })
    )
  )
  const errResponses = responses.filter(res => !res.found)
  if (errResponses.length) {
    throw new errors.BadRequestError(`Invalid skills: [${errResponses.map(res => res.skill)}]`)
  }
  return _.map(responses, 'name')
}

getSkillNamesByIds.schema = Joi.object()
  .keys({
    skills: Joi.array().items(Joi.string().uuid().required()).required()
  }).required()

/**
 * Finds and returns the ids of given skill names
 *
 * @param {Array<string>} skills the array of skill names
 * @returns {Array<string>} the array of skill ids
 */
async function getSkillIdsByNames (skills) {
  const tcSkills = await helper.getAllTopcoderSkills({ name: _.join(skills, ',') })
  // endpoint returns the partial matched skills
  // we need to filter by exact match case insensitive
  // const filteredSkills = _.filter(result, tcSkill => _.some(skills, skill => _.toLower(skill) === _.toLower(tcSkill.name)))
  const matchedSkills = _.map(skills, skillTag => tcSkills.find(tcSkill => _.toLower(skillTag) === _.toLower(tcSkill.name)))
  return _.map(matchedSkills, 'id')
}

getSkillIdsByNames.schema = Joi.object()
  .keys({
    skills: Joi.array().items(Joi.string().required()).required()
  }).required()

/**
 * Creates the role search request
 *
 * @param {Object} currentUser the user who perform this operation.
 * @param {Object} roleSearchRequest the role search request
 * @returns {RoleSearchRequest} the role search request entity
 */

async function createRoleSearchRequest (currentUser, roleSearchRequest) {
  roleSearchRequest.createdBy = await helper.getUserId(currentUser.userId)
  // if current user is not machine then it must be logged user
  if (!currentUser.isMachine) {
    roleSearchRequest.memberId = roleSearchRequest.createdBy
    // find the previous search done by this user
    const previous = await RoleSearchRequest.findOne({
      where: {
        memberId: roleSearchRequest.memberId
      },
      order: [['createdAt', 'DESC']]
    })
    if (previous) {
      roleSearchRequest.previousRoleSearchRequestId = previous.id
    }
  }
  const created = await RoleSearchRequest.create(roleSearchRequest)
  return created.toJSON()
}
createRoleSearchRequest.schema = Joi.object()
  .keys({
    currentUser: Joi.object().required(),
    roleSearchRequest: Joi.object().keys({
      roleId: Joi.string().uuid(),
      jobDescription: Joi.string().max(100000),
      skills: Joi.array().items(Joi.string().uuid().required())
    }).required().min(1)
  }).required()

/**
 * Exclude some fields from role if the user is external member
 *
 * @param {Object} currentUser the user who perform this operation.
 * @param {Object} role the role object to be cleaned
 * @returns {Object} the cleaned role
 */
async function _cleanRoleDTO (currentUser, role) {
  // if current user is machine, it means user is not logged in
  if (_.isNil(currentUser) || currentUser.isMachine || await isExternalMember(currentUser.userId)) {
    role.isExternalMember = true
    if (role.rates) {
      role.rates = _.map(role.rates, rate =>
        _.omit(rate, ['inCountry', 'offShore', 'niche', 'rate30InCountry', 'rate30OffShore', 'rate30Niche', 'rate20InCountry', 'rate20OffShore', 'rate20Niche']))
    }
    return role
  }
  role.isExternalMember = false
  return role
}

/**
 * Finds out if member is external member
 *
 * @param {number} memberId the external id of member
 * @returns {boolean}
 */
async function isExternalMember (memberId) {
  const groups = await helper.getMemberGroups(memberId)
  return _.intersection(config.INTERNAL_MEMBER_GROUPS, groups).length === 0
}

isExternalMember.schema = Joi.object()
  .keys({
    memberId: Joi.number().required()
  }).required()

/**
 * @param {Object} currentUser the user performing the operation.
 * @param {Object} data the team data
 * @returns {Object} the created project id
 */
async function createTeam (currentUser, data) {
  // before creating a project, we should validate the given roleSearchRequestIds
  // because if some data is missing it would fail to create jobs.
  const roleSearchRequests = await _validateRoleSearchRequests(_.map(data.positions, 'roleSearchRequestId'))
  const projectRequestBody = {
    name: data.teamName,
    description: data.teamDescription,
    type: 'talent-as-a-service',
    details: {
      positions: data.positions,
      utm: {
        code: data.refCode
      }
    }
  }
  // create project with given data
  const project = await helper.createProject(currentUser, projectRequestBody)
  // create jobs for the given positions.
  const jobs = await Promise.all(_.map(data.positions, async position => {
    const roleSearchRequest = roleSearchRequests[position.roleSearchRequestId]
    const job = {
      projectId: project.id,
      title: position.roleName,
      numPositions: position.numberOfResources,
      rateType: position.rateType,
      workload: position.workload,
      hoursPerWeek: position.hoursPerWeek,
      skills: roleSearchRequest.skills,
      description: roleSearchRequest.jobDescription,
      roleIds: [roleSearchRequest.roleId],
      resourceType: roleSearchRequest.resourceType
    }
    if (position.startMonth) {
      job.startDate = position.startMonth
    }
    if (position.durationWeeks) {
      job.duration = position.durationWeeks
    }
    return await JobService.createJob(currentUser, job, true)
  }))
  await eventDispatcher.handleEvent(config.TAAS_TEAM_CREATE_TOPIC, { project, jobs })
  return { projectId: project.id }
}

createTeam.schema = Joi.object()
  .keys({
    currentUser: Joi.object().required(),
    data: Joi.object().keys({
      teamName: Joi.string().required(),
      teamDescription: Joi.string(),
      refCode: Joi.string(),
      positions: Joi.array().items(
        Joi.object().keys({
          roleName: Joi.string().required(),
          roleSearchRequestId: Joi.string().uuid().required(),
          numberOfResources: Joi.number().integer().min(1).required(),
          durationWeeks: Joi.number().integer().min(1),
          startMonth: Joi.date(),
          rateType: Joi.rateType().default('weekly'),
          workload: Joi.workload().default('full-time'),
          hoursPerWeek: Joi.number().integer().positive(),
          resourceType: Joi.string()
        }).required()
      ).required()
    }).required()
  })
  .required()

/**
 * @param {Array<string>} roleSearchRequestIds the roleSearchRequestIds
 * @returns {Object} the roleSearchRequests
 */
async function _validateRoleSearchRequests (roleSearchRequestIds) {
  const roleSearchRequests = {}
  await Promise.all(_.map(roleSearchRequestIds, async roleSearchRequestId => {
    // check if roleSearchRequest exists
    const roleSearchRequest = await RoleSearchRequest.findById(roleSearchRequestId)
    // store the found roleSearchRequest to avoid unnecessary DB calls
    roleSearchRequests[roleSearchRequestId] = roleSearchRequest.toJSON()
    // we can't create a job without a role
    if (!roleSearchRequest.roleId) {
      throw new errors.ConflictError(`roleSearchRequestId: ${roleSearchRequestId} must have roleId`)
    }
    const role = await Role.findById(roleSearchRequest.roleId)
    // if roleSearchRequest doesn't have skills, we have to get skills through role
    if (!roleSearchRequest.skills) {
      if (!role.listOfSkills) {
        throw new errors.ConflictError(`role: ${role.id} must have skills`)
      }
      // store role's skills
      roleSearchRequests[roleSearchRequestId].skills = await getSkillIdsByNames(role.listOfSkills)
    }
    if (!roleSearchRequest.jobDescription) {
      roleSearchRequests[roleSearchRequestId].jobDescription = role.description
    }
    roleSearchRequests[roleSearchRequestId].resourceType = role.name
  }))
  return roleSearchRequests
}

/**
 * Search skills
 * @param {Object} criteria the search criteria
 * @returns {Object} the search result, contain total/page/perPage and result array
 */
async function searchSkills (criteria) {
  return helper.getTopcoderSkills(criteria)
}

searchSkills.schema = Joi.object().keys({
  criteria: Joi.object().keys({
    page: Joi.page(),
    perPage: Joi.perPage(),
    orderBy: Joi.string()
  }).required()
}).required()

/**
 * Get member suggestions
 * @param {object} currentUser the user performing the operation.
 * @param {string} fragment the user's handle fragment
 * @returns {Array} the search result, contains result array
 */
async function suggestMembers (currentUser, fragment) {
  if (!currentUser.hasManagePermission) {
    throw new errors.ForbiddenError('You are not allowed to perform this action!')
  }
  const { result } = await helper.getMembersSuggest(fragment)
  return result.content
}

suggestMembers.schema = Joi.object().keys({
  currentUser: Joi.object().required(),
  fragment: Joi.string().required()
}).required()

/**
 * Calculates total amount
 * @param {Object} amount
 * @returns {int} totalAmount
 */
async function calculateAmount (amount) {
  const totalAmount = _.sum(_.map(amount, amt => amt.numberOfResources * amt.rate))
  return { totalAmount }
}

/**
 * Creates token for stripe
 * @param {int} totalAmount
 * @returns {string} paymentIntentToken
 */
async function createPayment (totalAmount) {
  const dollarToCents = (totalAmount * 100)
  const paymentIntent = await stripe.paymentIntents.create({
    amount: dollarToCents,
    currency: config.CURRENCY
  })
  return { paymentIntentToken: paymentIntent.client_secret }
}

module.exports = {
  searchTeams,
  getTeam,
  getTeamJob,
  sendEmail,
  addMembers,
  searchMembers,
  searchInvites,
  deleteMember,
  getMe,
  roleSearchRequest,
  getRoleBySkills,
  getSkillsByJobDescription,
  getSkillNamesByIds,
  getSkillIdsByNames,
  createRoleSearchRequest,
  isExternalMember,
  createTeam,
  calculateAmount,
  createPayment,
  searchSkills,
  suggestMembers
}
