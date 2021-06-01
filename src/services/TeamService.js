/**
 * This service provides operations of Job.
 */

const _ = require('lodash');
const Joi = require('joi');
const dateFNS = require('date-fns');
const config = require('config');
const emailTemplateConfig = require('../../config/email_template.config');
const helper = require('../common/helper');
const logger = require('../common/logger');
const errors = require('../common/errors');
const JobService = require('./JobService');
const ResourceBookingService = require('./ResourceBookingService');

const emailTemplates = _.mapValues(emailTemplateConfig, (template) => {
  return {
    subject: template.subject,
    body: template.body,
    from: template.from,
    recipients: template.recipients,
    cc: template.cc,
    sendgridTemplateId: template.sendgridTemplateId,
  };
});

/**
 * Function to get placed resource bookings with specific projectIds
 * @param {Object} currentUser the user who perform this operation.
 * @param {Array} projectIds project ids
 * @returns the request result
 */
async function _getPlacedResourceBookingsByProjectIds(currentUser, projectIds) {
  const criteria = { status: 'placed', projectIds };
  const { result } = await ResourceBookingService.searchResourceBookings(
    currentUser,
    criteria,
    { returnAll: true }
  );
  return result;
}

/**
 * Function to get jobs by projectIds
 * @param {Object} currentUser the user who perform this operation.
 * @param {Array} projectIds project ids
 * @returns the request result
 */
async function _getJobsByProjectIds(currentUser, projectIds) {
  const { result } = await JobService.searchJobs(
    currentUser,
    { projectIds },
    { returnAll: true }
  );
  return result;
}

/**
 * List teams
 * @param {Object} currentUser the user who perform this operation
 * @param {Object} criteria the search criteria
 * @returns {Object} the search result, contain total/page/perPage and result array
 */
async function searchTeams(currentUser, criteria) {
  const sort = `${criteria.sortBy} ${criteria.sortOrder}`;
  // Get projects from /v5/projects with searching criteria
  const {
    total,
    page,
    perPage,
    result: projects,
  } = await helper.getProjects(currentUser, {
    page: criteria.page,
    perPage: criteria.perPage,
    name: criteria.name,
    sort,
  });
  return {
    total,
    page,
    perPage,
    result: await getTeamDetail(currentUser, projects),
  };
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
          otherwise: Joi.string().valid('asc', 'desc').default('desc'),
        }),
        name: Joi.string(),
      })
      .required(),
  })
  .required();

/**
 * Get team details
 * @param {Object} currentUser the user who perform this operation
 * @param {Object} projects the projects
 * @param {Object} isSearch the flag whether for search function
 * @returns {Object} the search result
 */
async function getTeamDetail(currentUser, projects, isSearch = true) {
  const projectIds = _.map(projects, 'id');
  // Get all placed resourceBookings filtered by projectIds
  const resourceBookings = await _getPlacedResourceBookingsByProjectIds(
    currentUser,
    projectIds
  );
  // Get all jobs filtered by projectIds
  const jobs = await _getJobsByProjectIds(currentUser, projectIds);

  // Get first week day and last week day
  const curr = new Date();
  const firstDay = dateFNS.startOfWeek(curr);
  const lastDay = dateFNS.endOfWeek(curr);

  logger.debug({
    component: 'TeamService',
    context: 'getTeamDetail',
    message: `week started: ${firstDay}, week ended: ${lastDay}`,
  });

  const result = [];
  for (const project of projects) {
    const rbs = _.filter(resourceBookings, { projectId: project.id });
    const res = _.clone(project);
    res.weeklyCost = 0;
    res.resources = [];

    if (rbs && rbs.length > 0) {
      // Get minimal start date and maximal end date
      const startDates = [];
      const endDates = [];
      for (const rbsItem of rbs) {
        if (rbsItem.startDate) {
          startDates.push(new Date(rbsItem.startDate));
        }
        if (rbsItem.endDate) {
          endDates.push(new Date(rbsItem.endDate));
        }
      }

      if (startDates && startDates.length > 0) {
        res.startDate = _.min(startDates);
      }
      if (endDates && endDates.length > 0) {
        res.endDate = _.max(endDates);
      }

      // Count weekly rate
      for (const item of rbs) {
        // ignore any resourceBooking that has customerRate missed
        if (!item.customerRate) {
          continue;
        }
        const startDate = new Date(item.startDate);
        const endDate = new Date(item.endDate);

        // normally startDate is smaller than endDate for a resourceBooking so not check if startDate < endDate
        if (
          (!item.startDate || startDate < lastDay) &&
          (!item.endDate || endDate > firstDay)
        ) {
          res.weeklyCost += item.customerRate;
        }
      }

      const resourceInfos = await Promise.all(
        _.map(rbs, (rb) => {
          return helper.getUserById(rb.userId, true).then((user) => {
            const resource = {
              id: rb.id,
              userId: user.id,
              ..._.pick(user, ['handle', 'firstName', 'lastName', 'skills']),
            };
            // If call function is not search, add jobId field
            if (!isSearch) {
              resource.jobId = rb.jobId;
              resource.customerRate = rb.customerRate;
              resource.startDate = rb.startDate;
              resource.endDate = rb.endDate;
            }
            return resource;
          });
        })
      );
      if (resourceInfos && resourceInfos.length > 0) {
        res.resources = resourceInfos;

        const userHandles = _.map(resourceInfos, 'handle');
        // Get user photo from /v5/members
        const members = await helper.getMembers(userHandles);

        for (const item of res.resources) {
          const findMember = _.find(members, {
            handleLower: item.handle.toLowerCase(),
          });
          if (findMember && findMember.photoURL) {
            item.photo_url = findMember.photoURL;
          }
        }
      }
    }

    const jobsTmp = _.filter(jobs, { projectId: project.id });
    if (jobsTmp && jobsTmp.length > 0) {
      if (isSearch) {
        // Count total positions
        res.totalPositions = 0;
        for (const item of jobsTmp) {
          // only sum numPositions of jobs whose status is NOT cancelled or closed
          if (['cancelled', 'closed'].includes(item.status)) {
            continue;
          }
          res.totalPositions += item.numPositions;
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
            'title',
          ]);
        });
      }
    }
    result.push(res);
  }

  return result;
}

/**
 * Get team by id
 * @param {Object} currentUser the user who perform this operation
 * @param {String} id the job id
 * @returns {Object} the team
 */
async function getTeam(currentUser, id) {
  const project = await helper.getProjectById(currentUser, id);
  const result = await getTeamDetail(currentUser, [project], false);
  const teamDetail = result[0];

  // add job skills for result
  let jobSkills = [];
  if (teamDetail && teamDetail.jobs) {
    for (const job of teamDetail.jobs) {
      if (job.skills) {
        const usersPromises = [];
        _.map(job.skills, (skillId) => {
          usersPromises.push(helper.getSkillById(skillId));
        });
        jobSkills = await Promise.all(usersPromises);
        job.skills = jobSkills;
      }
    }
  }

  return teamDetail;
}

getTeam.schema = Joi.object()
  .keys({
    currentUser: Joi.object().required(),
    id: Joi.number().integer().required(),
  })
  .required();

/**
 * Get team job with id
 * @param {Object} currentUser the user who perform this operation
 * @param {String} id the team id
 * @param {String} jobId the job id
 * @returns the team job
 */
async function getTeamJob(currentUser, id, jobId) {
  const project = await helper.getProjectById(currentUser, id);
  const jobs = await _getJobsByProjectIds(currentUser, [project.id]);
  const job = _.find(jobs, { id: jobId });

  if (!job) {
    throw new errors.NotFoundError(
      `id: ${jobId} "Job" with Team id ${id} doesn't exist`
    );
  }
  const result = {
    id: job.id,
    title: job.title,
  };

  if (job.skills) {
    result.skills = await Promise.all(
      _.map(job.skills, (skillId) => helper.getSkillById(skillId))
    );
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
    );
    const userMap = _.groupBy(users, 'id');

    // find photo URLs for users
    const members = await helper.getMembers(_.map(users, 'handle'));
    const photoURLMap = _.groupBy(members, 'handleLower');

    result.candidates = _.map(job.candidates, (candidate) => {
      const candidateData = _.pick(candidate, [
        'status',
        'resume',
        'userId',
        'interviews',
        'id',
      ]);
      const userData = userMap[candidate.userId][0];
      // attach user data to the candidate
      Object.assign(
        candidateData,
        _.pick(userData, ['handle', 'firstName', 'lastName', 'skills'])
      );
      // attach photo URL to the candidate
      const handleLower = userData.handle.toLowerCase();
      if (photoURLMap[handleLower]) {
        candidateData.photo_url = photoURLMap[handleLower][0].photoURL;
      }
      return candidateData;
    });
  }

  return result;
}

getTeamJob.schema = Joi.object()
  .keys({
    currentUser: Joi.object().required(),
    id: Joi.number().integer().required(),
    jobId: Joi.string().guid().required(),
  })
  .required();

/**
 * Send email through a particular template
 * @param {Object} currentUser the user who perform this operation
 * @param {Object} data the email object
 * @returns {undefined}
 */
async function sendEmail(currentUser, data) {
  const template = emailTemplates[data.template];
  const dataCC = data.cc || [];
  const templateCC = template.cc || [];
  const dataRecipients = data.recipients || [];
  const templateRecipients = template.recipients || [];
  const subjectBody = {
    subject: data.subject || template.subject,
    body: data.body || template.body,
  };
  for (const key in subjectBody) {
    subjectBody[key] = await helper.substituteStringByObject(
      subjectBody[key],
      data.data
    );
  }
  const emailData = {
    // override template if coming data already have the 'from' address
    from: data.from || template.from,
    // create a set of uniq. recipients & CCs, from both coming data & template
    recipients: _.uniq([...dataRecipients, ...templateRecipients]),
    cc: _.uniq([...dataCC, ...templateCC]),
    data: { ...data.data, ...subjectBody },
    sendgrid_template_id: template.sendgridTemplateId,
    version: 'v3',
  };
  await helper.postEvent(config.EMAIL_TOPIC, emailData);
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
        cc: Joi.array().items(Joi.string().email()).allow(null),
      })
      .required(),
  })
  .required();

/**
 * Add a member to a team as customer.
 *
 * @param {Number} projectId project id
 * @param {String} userId user id
 * @param {String} fields the fields to be returned
 * @returns {Object} the member added
 */
async function _addMemberToProjectAsCustomer(projectId, userId, fields) {
  try {
    const member = await helper.createProjectMember(
      projectId,
      { userId: userId, role: 'customer' },
      { fields }
    );
    return member;
  } catch (err) {
    err.message = _.get(err, 'response.body.message') || err.message;
    if (err.message && err.message.includes('User already registered')) {
      throw new Error('User is already added');
    }
    logger.error({
      component: 'TeamService',
      context: '_addMemberToProjectAsCustomer',
      message: err.message,
    });
    throw err;
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
async function addMembers(currentUser, id, criteria, data) {
  await helper.getProjectById(currentUser, id); // check whether the user can access the project

  const result = {
    success: [],
    failed: [],
  };

  const handles = data.handles || [];
  const emails = data.emails || [];

  const handleMembers = await helper
    .getMemberDetailsByHandles(handles)
    .then((members) =>
      _.map(members, (member) => ({
        ...member,
        // populate members with lower-cased handle for case insensitive search
        handleLowerCase: member.handle.toLowerCase(),
      }))
    );

  const emailMembers = await helper
    .getMemberDetailsByEmails(emails)
    .then((members) =>
      _.map(members, (member) => ({
        ...member,
        // populate members with lower-cased email for case insensitive search
        emailLowerCase: member.email.toLowerCase(),
      }))
    );

  await Promise.all([
    Promise.all(
      handles.map((handle) => {
        const memberDetails = _.find(handleMembers, {
          handleLowerCase: handle.toLowerCase(),
        });

        if (!memberDetails) {
          result.failed.push({ error: "User doesn't exist", handle });
          return;
        }

        return _addMemberToProjectAsCustomer(
          id,
          memberDetails.userId,
          criteria.fields
        )
          .then((member) => {
            // note, that we return `handle` in the same case it was in request
            result.success.push({ ...member, handle });
          })
          .catch((err) => {
            result.failed.push({ error: err.message, handle });
          });
      })
    ),

    Promise.all(
      emails.map((email) => {
        const memberDetails = _.find(emailMembers, {
          emailLowerCase: email.toLowerCase(),
        });

        if (!memberDetails) {
          result.failed.push({ error: "User doesn't exist", email });
          return;
        }

        return _addMemberToProjectAsCustomer(
          id,
          memberDetails.id,
          criteria.fields
        )
          .then((member) => {
            // note, that we return `email` in the same case it was in request
            result.success.push({ ...member, email });
          })
          .catch((err) => {
            result.failed.push({ error: err.message, email });
          });
      })
    ),
  ]);

  return result;
}

addMembers.schema = Joi.object()
  .keys({
    currentUser: Joi.object().required(),
    id: Joi.number().integer().required(),
    criteria: Joi.object()
      .keys({
        fields: Joi.string(),
      })
      .required(),
    data: Joi.object()
      .keys({
        handles: Joi.array().items(Joi.string()),
        emails: Joi.array().items(Joi.string().email()),
      })
      .or('handles', 'emails')
      .required(),
  })
  .required();

/**
 * Search members in a team.
 * Serves as a proxy endpoint for `GET /projects/{projectId}/members`.
 *
 * @param {Object} currentUser the user who perform this operation.
 * @param {String} id the team id
 * @params {Object} criteria the search criteria
 * @returns {Object} the search result
 */
async function searchMembers(currentUser, id, criteria) {
  const result = await helper.listProjectMembers(currentUser, id, criteria);
  return { result };
}

searchMembers.schema = Joi.object()
  .keys({
    currentUser: Joi.object().required(),
    id: Joi.number().integer().required(),
    criteria: Joi.object()
      .keys({
        role: Joi.string(),
        fields: Joi.string(),
      })
      .required(),
  })
  .required();

/**
 * Search member invites for a team.
 * Serves as a proxy endpoint for `GET /projects/{projectId}/invites`.
 *
 * @param {Object} currentUser the user who perform this operation.
 * @param {String} id the team id
 * @params {Object} criteria the search criteria
 * @returns {Object} the search result
 */
async function searchInvites(currentUser, id, criteria) {
  const result = await helper.listProjectMemberInvites(
    currentUser,
    id,
    criteria
  );
  return { result };
}

searchInvites.schema = Joi.object()
  .keys({
    currentUser: Joi.object().required(),
    id: Joi.number().integer().required(),
    criteria: Joi.object()
      .keys({
        fields: Joi.string(),
      })
      .required(),
  })
  .required();

/**
 * Remove a member from a team.
 * Serves as a proxy endpoint for `DELETE /projects/{projectId}/members/{id}`.
 *
 * @param {Object} currentUser the user who perform this operation.
 * @param {String} id the team id
 * @param {String} projectMemberId the id of the project member
 * @returns {undefined}
 */
async function deleteMember(currentUser, id, projectMemberId) {
  await helper.deleteProjectMember(currentUser, id, projectMemberId);
}

deleteMember.schema = Joi.object()
  .keys({
    currentUser: Joi.object().required(),
    id: Joi.number().integer().required(),
    projectMemberId: Joi.number().integer().required(),
  })
  .required();

/**
 * Return details about the current user.
 *
 * @param {Object} currentUser the user who perform this operation.
 * @params {Object} criteria the search criteria
 * @returns {Object} the user data for current user
 */
async function getMe(currentUser) {
  return helper.getUserByExternalId(currentUser.userId);
}

getMe.schema = Joi.object()
  .keys({
    currentUser: Joi.object().required(),
  })
  .required();

/**
 * Return skills by job description.
 *
 * @param {Object} currentUser the user who perform this operation.
 * @params {Object} criteria the search criteria
 * @returns {Object} the user data for current user
 */
async function getSkillsByJobDescription(currentUser,data) {
  return helper.getTags(data.description)
}

getSkillsByJobDescription.schema = Joi.object()
  .keys({
    currentUser: Joi.object().required(),
    data: Joi.object()
      .keys({
        description: Joi.string().required(),
      })
      .required(),
  })
  .required();


/**
 * @param {Object} currentUser the user performing the operation.
 * @param {Object} data project data
 * @returns {Object} the created project
 */
async function createProj(currentUser, data) {
  return helper.createProject(currentUser, data);
}

createProj.schema = Joi.object()
  .keys({
    currentUser: Joi.object().required(),
    data: Joi.object().required(),
  })
  .required();

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
  getSkillsByJobDescription,
  createProj,
};
