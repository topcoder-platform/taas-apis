/**
 * Notification scheduler service - has the cron handlers for sending different types of notifications (email, web etc)
 */
const _ = require('lodash')
const { Op } = require('sequelize')
const moment = require('moment')
const config = require('config')
const models = require('../models')
const Job = models.Job
const JobCandidate = models.JobCandidate
const Interview = models.Interview
const ResourceBooking = models.ResourceBooking
const helper = require('../common/helper')
const constants = require('../../app-constants')
const logger = require('../common/logger')
const { getAuditM2Muser } = require('../common/helper')
const interviewService = require('./InterviewService')

const localLogger = {
  debug: (message, context) => logger.debug({ component: 'NotificationSchedulerService', context, message }),
  error: (message, context) => logger.error({ component: 'NotificationSchedulerService', context, message }),
  info: (message, context) => logger.info({ component: 'NotificationSchedulerService', context, message })
}

const emailTemplates = helper.getEmailTemplatesForKey('notificationEmailTemplates')

/**
 * Returns the project with the given id
 * @param projectId the project id
 * @returns the project
 */
async function getProjectWithId (projectId) {
  let project = null
  try {
    project = await helper.getProjectById(helper.getAuditM2Muser(), projectId)
  } catch (err) {
    localLogger.error(
      `exception fetching project with id: ${projectId} Status Code: ${err.status} message: ${_.get(err, 'response.text', err.toString())}`, 'getProjectWithId')
  }

  return project
}

/**
 * extract the members of projects and build recipients list out of them
 * we can use `userId` to identify recipients
 * @param project the project
 * @returns {string[]} array of recipients
 */
function buildProjectTeamRecipients (project) {
  const recipients = _.unionBy(_.map(project.members, m => _.pick(m, 'userId')), 'userId')
  if (_.isEmpty(recipients)) {
    localLogger.error(`No recipients for projectId:${project.id}`, 'buildProjectTeamRecipients')
  }

  return recipients
}

/**
 * Gets the user with the given id
 * @param userId the user id
 * @returns the user
 */
async function getUserWithId (userId) {
  let user = null
  try {
    user = await helper.ensureUserById(userId)
  } catch (err) {
    localLogger.error(
      `exception fetching user with id: ${userId} Status Code: ${err.status} message: ${_.get(err, 'response.text', err.toString())}`, 'getUserWithId')
  }

  return user
}

/**
 * returns the data for the interview
 * @param interview the interview
 * @param jobCandidate optional jobCandidate corresponding to interview
 * @param job option job corresponding to interview
 * @returns the interview details in format used by client
 */
async function getDataForInterview (interview, jobCandidate, job) {
  jobCandidate = jobCandidate || await JobCandidate.findById(interview.jobCandidateId)

  job = job || await Job.findById(jobCandidate.jobId)

  const hostUserDetails = await helper.getUserDetailsByUserUUID(interview.hostUserId)
  const userDetails = await helper.getUserDetailsByUserUUID(jobCandidate.userId)
  const user = await getUserWithId(jobCandidate.userId)
  if (!user) { return null }

  const interviewLink = `${config.TAAS_APP_URL}/${job.projectId}/positions/${job.id}/candidates/interviews`
  const startTime = interview.startTimestamp ? helper.formatDateTimeEDT(interview.startTimestamp) : ''
  const jobUrl = `${config.TAAS_APP_URL}/${job.projectId}/positions/${job.id}`
  const applicationUrl = `${config.TAAS_APP_EARN_URL}?status=Active%20Gigs`

  return {
    jobTitle: job.title,
    guestFullName: userDetails.firstName + ' ' + userDetails.lastName,
    guestEmail: userDetails.email,
    hostEmail: hostUserDetails.email,
    hostFullName: hostUserDetails.firstName + ' ' + hostUserDetails.lastName,
    candidateName: `${user.firstName} ${user.lastName}`,
    handle: user.handle,
    attendees: interview.guestNames,
    startTime: startTime,
    duration: interview.duration,
    interviewId: interview.id,
    interviewRound: interview.round,
    interviewLink,
    applicationUrl,
    jobUrl

  }
}

/**
 * Sends notifications to all the teams which have candidates available for review
 */
async function sendCandidatesAvailableNotifications () {
  localLogger.debug('[sendCandidatesAvailableNotifications]: Looking for due records...')
  const jobsDao = await Job.findAll({
    include: [{
      model: JobCandidate,
      as: 'candidates',
      required: true,
      where: {
        status: constants.JobStatus.OPEN
      }
    }]
  })
  const jobs = _.map(jobsDao, dao => dao.dataValues)

  const projectIds = _.uniq(_.map(jobs, job => job.projectId))

  localLogger.debug(`[sendCandidatesAvailableNotifications]: Found ${projectIds.length} projects with Job Candidates awaiting for review.`)

  // for each unique project id, send an email
  let sentCount = 0
  for (const projectId of projectIds) {
    const project = await getProjectWithId(projectId)
    if (!project) { continue }

    const projectTeamRecipients = buildProjectTeamRecipients(project)
    const projectJobs = _.filter(jobs, job => job.projectId === projectId)

    const teamJobs = []
    for (const projectJob of projectJobs) {
      // get candidate list
      const jobCandidates = []
      for (const jobCandidate of projectJob.candidates) {
        const user = await getUserWithId(jobCandidate.userId)
        if (!user) { continue }

        jobCandidates.push({
          handle: user.handle,
          status: jobCandidate.status
        })
      }

      // review link
      const reviewLink = `${config.TAAS_APP_URL}/${projectId}/positions/${projectJob.id}/candidates/to-review`

      // get # of resource bookings
      const nResourceBookings = await ResourceBooking.count({
        where: {
          jobId: projectJob.id
        }
      })

      const jobUrl = `${config.TAAS_APP_URL}/${projectId}/positions/${projectJob.id}`
      teamJobs.push({
        title: projectJob.title,
        nResourceBookings,
        jobCandidates,
        reviewLink,
        jobUrl
      })
    }

    sendNotification({}, {
      template: 'taas.notification.candidates-available-for-review',
      recipients: projectTeamRecipients,
      data: {
        teamName: project.name,
        teamJobs
      }
    })

    sentCount++
  }
  localLogger.debug(`[sendCandidatesAvailableNotifications]: Sent notifications for ${sentCount} of ${projectIds.length} projects with Job Candidates awaiting for review.`)
}

/**
 * Sends reminders to the hosts and guests about their upcoming interview(s)
 */
async function sendInterviewComingUpNotifications () {
  localLogger.debug('[sendInterviewComingUpNotifications]: Looking for due records...')
  const currentTime = moment.utc().startOf('minute')
  const timestampFilter = {
    [Op.or]: []
  }
  const window = moment.duration(config.INTERVIEW_COMING_UP_MATCH_WINDOW)
  for (const remindTime of config.INTERVIEW_COMING_UP_REMIND_TIME) {
    const rangeStart = currentTime.clone().add(moment.duration(remindTime))
    const rangeEnd = rangeStart.clone().add(window)

    timestampFilter[Op.or].push({
      [Op.and]: [
        {
          [Op.gte]: rangeStart
        },
        {
          [Op.lt]: rangeEnd
        }
      ]
    })
  }

  const filter = {
    [Op.and]: [
      {
        status: {
          [Op.in]: [
            constants.Interviews.Status.Scheduled,
            constants.Interviews.Status.Rescheduled
          ]
        }
      },
      {
        startTimestamp: timestampFilter
      }
    ]
  }

  const interviews = await Interview.findAll({
    where: filter,
    raw: true
  })

  localLogger.debug(`[sendInterviewComingUpNotifications]: Found ${interviews.length} interviews which are coming soon.`)

  let sentHostCount = 0
  let sentGuestCount = 0
  for (const interview of interviews) {
    // send host email
    const data = await getDataForInterview(interview)
    if (!data) { continue }

    if (!_.isEmpty(interview.hostEmail)) {
      sendNotification({}, {
        template: 'taas.notification.interview-coming-up-host',
        recipients: [{ email: interview.hostEmail }],
        data
      })

      sentHostCount++
    } else {
      localLogger.error(`Interview id: ${interview.id} host email not present`, 'sendInterviewComingUpNotifications')
    }

    if (!_.isEmpty(interview.guestEmails)) {
      // send guest emails
      sendNotification({}, {
        template: 'taas.notification.interview-coming-up-guest',
        recipients: interview.guestEmails.map((email) => ({ email })),
        data
      })

      sentGuestCount++
    } else {
      localLogger.error(`Interview id: ${interview.id} guest emails not present`, 'sendInterviewComingUpNotifications')
    }
  }

  localLogger.debug(`[sendInterviewComingUpNotifications]: Sent notifications for ${sentHostCount} hosts and ${sentGuestCount} guest of ${interviews.length} interviews which are coming soon.`)
}

/**
 * Sends reminder to the interview host after it ends to change the interview status
 */
async function sendInterviewCompletedNotifications () {
  localLogger.debug('[sendInterviewCompletedNotifications]: Looking for due records...')
  const window = moment.duration(config.INTERVIEW_COMPLETED_MATCH_WINDOW)
  const rangeStart = moment.utc().startOf('minute').subtract(moment.duration(config.INTERVIEW_COMPLETED_PAST_TIME))
  const rangeEnd = rangeStart.clone().add(window)
  const filter = {
    [Op.and]: [
      {
        status: {
          [Op.in]: [
            constants.Interviews.Status.Scheduled,
            constants.Interviews.Status.Rescheduled,
            constants.Interviews.Status.Completed
          ]
        }
      },
      {
        startTimestamp: {
          [Op.and]: [
            {
              [Op.gte]: rangeStart
            },
            {
              [Op.lt]: rangeEnd
            }
          ]
        }
      }
    ]
  }

  let interviews = await Interview.findAll({
    where: filter,
    raw: true
  })
  interviews = _.map(_.values(_.groupBy(interviews, 'jobCandidateId')), (interviews) => _.maxBy(interviews, 'round'))

  const jobCandidates = await JobCandidate.findAll({ where: { id: _.map(interviews, 'jobCandidateId') } })
  const jcMap = _.keyBy(jobCandidates, 'id')

  localLogger.debug(`[sendInterviewCompletedNotifications]: Found ${interviews.length} interviews which must be ended by now.`)

  let sentCount = 0
  for (const interview of interviews) {
    if (_.isEmpty(interview.hostEmail)) {
      localLogger.error(`Interview id: ${interview.id} host email not present`)
      continue
    }
    if (!jcMap[interview.jobCandidateId] || jcMap[interview.jobCandidateId].status !== constants.JobCandidateStatus.INTERVIEW) {
      localLogger.error(`Interview id: ${interview.id} job candidate status is not ${constants.JobCandidateStatus.INTERVIEW}`)
      continue
    }

    const data = await getDataForInterview(interview, jcMap[interview.jobCandidateId])
    if (!data) { continue }

    sendNotification({}, {
      template: 'taas.notification.interview-awaits-resolution',
      recipients: [{ email: interview.hostEmail }],
      data
    })

    sentCount++
  }

  localLogger.debug(`[sendInterviewCompletedNotifications]: Sent notifications for ${sentCount} of ${interviews.length} interviews which must be ended by now.`)
}

/**
 * Sends reminder to the all members of teams which have interview completed to take action
 * to update the job candidate status
 */
async function sendPostInterviewActionNotifications () {
  localLogger.debug('[sendPostInterviewActionNotifications]: Looking for due records...')
  const completedJobCandidates = await JobCandidate.findAll({
    where: {
      status: constants.JobCandidateStatus.INTERVIEW
    },
    include: [{
      model: Interview,
      as: 'interviews',
      required: true,
      where: {
        status: {
          [Op.in]: [
            constants.Interviews.Status.Scheduled,
            constants.Interviews.Status.Rescheduled,
            constants.Interviews.Status.Completed
          ]
        },
        startTimestamp: {
          [Op.lte]: moment.utc().subtract(moment.duration(config.POST_INTERVIEW_ACTION_MATCH_WINDOW))
        }
      }
    }]
  })

  // get all project ids for this job candidates
  const jobs = await Job.findAll({
    where: {
      id: {
        [Op.in]: completedJobCandidates.map(jc => jc.jobId)
      }
    },
    raw: true
  })

  const projectIds = _.uniq(_.map(jobs, job => job.projectId))

  localLogger.debug(`[sendPostInterviewActionNotifications]: Found ${projectIds.length} projects with ${completedJobCandidates.length} Job Candidates with interview completed awaiting for an action.`)

  let sentCount = 0
  const template = 'taas.notification.post-interview-action-required'

  for (const projectId of projectIds) {
    const project = await getProjectWithId(projectId)
    if (!project) { continue }
    const webNotifications = []
    const projectTeamRecipients = buildProjectTeamRecipients(project)
    const projectJobs = _.filter(jobs, job => job.projectId === projectId)
    const teamInterviews = []
    let numCandidates = 0
    for (const projectJob of projectJobs) {
      const projectJcs = _.filter(completedJobCandidates, jc => jc.jobId === projectJob.id)
      numCandidates += projectJcs.length
      for (const projectJc of projectJcs) {
        const interview = _.maxBy(projectJc.interviews, 'round')
        const d = await getDataForInterview(interview, projectJc, projectJob)
        if (!d) { continue }
        d.jobUrl = `${config.TAAS_APP_URL}/${projectId}/positions/${projectJob.id}`
        webNotifications.push({
          serviceId: 'web',
          type: template,
          details: {
            recipients: projectTeamRecipients,
            contents: {
              jobTitle: d.jobTitle,
              teamName: project.name,
              projectId,
              jobId: projectJob.id,
              userHandle: d.handle
            },
            version: 1
          }
        })

        teamInterviews.push(d)
      }
    }

    sendNotification({}, {
      template,
      recipients: projectTeamRecipients,
      data: {
        teamName: project.name,
        numCandidates,
        teamInterviews
      }
    }, webNotifications)

    sentCount++
  }

  localLogger.debug(`[sendPostInterviewActionNotifications]: Sent notifications for ${sentCount} of ${projectIds.length} projects with Job Candidates with interview completed awaiting for an action.`)
}

/**
 * Sends reminders to all members of teams which have atleast one upcoming resource booking expiration
 */
async function sendResourceBookingExpirationNotifications () {
  localLogger.debug('[sendResourceBookingExpirationNotifications]: Looking for due records...')
  const currentTime = moment.utc()
  const maxEndDate = currentTime.clone().add(moment.duration(config.RESOURCE_BOOKING_EXPIRY_TIME))

  const expiringResourceBookings = await ResourceBooking.findAll({
    where: {
      endDate: {
        [Op.and]: [
          {
            [Op.gt]: currentTime
          },
          {
            [Op.lte]: maxEndDate
          }
        ]
      }
    },
    raw: true
  })

  const jobs = await Job.findAll({
    where: {
      id: {
        [Op.in]: _.map(expiringResourceBookings, rb => rb.jobId)
      }
    },
    raw: true
  })
  const projectIds = _.uniq(_.map(expiringResourceBookings, rb => rb.projectId))

  localLogger.debug(`[sendResourceBookingExpirationNotifications]: Found ${projectIds.length} projects with ${expiringResourceBookings.length} Resource Bookings expiring in less than 3 weeks.`)

  let sentCount = 0
  const template = 'taas.notification.resource-booking-expiration'
  for (const projectId of projectIds) {
    const project = await getProjectWithId(projectId)
    if (!project) { continue }
    const projectTeamRecipients = buildProjectTeamRecipients(project)
    const projectJobs = _.filter(jobs, job => job.projectId === projectId)

    let numResourceBookings = 0
    const teamResourceBookings = []
    for (const projectJob of projectJobs) {
      const resBookings = _.filter(expiringResourceBookings, rb => rb.jobId === projectJob.id)
      numResourceBookings += resBookings.length

      for (const booking of resBookings) {
        const user = await getUserWithId(booking.userId)
        if (!user) { continue }

        const jobUrl = `${config.TAAS_APP_URL}/${projectId}/positions/${projectJob.id}`
        const resourceBookingUrl = `${config.TAAS_APP_URL}/${projectId}/rb/${booking.id}`
        teamResourceBookings.push({
          jobTitle: projectJob.title,
          handle: user.handle,
          endDate: booking.endDate,
          jobUrl,
          resourceBookingUrl
        })
      }
    }

    const webData = {
      serviceId: 'web',
      type: template,
      details: {
        recipients: projectTeamRecipients,
        contents: {
          teamName: project.name,
          projectId,
          numOfExpiringResourceBookings: numResourceBookings
        },
        version: 1
      }
    }

    const teamUrl = `${config.TAAS_APP_URL}/${project.id}`

    sendNotification({}, {
      template,
      recipients: projectTeamRecipients,
      data: {
        teamName: project.name,
        numResourceBookings,
        teamResourceBookings,
        teamUrl
      }
    }, [webData])

    sentCount++
  }

  localLogger.debug(`[sendResourceBookingExpirationNotifications]: Sent notifications for ${sentCount} of ${projectIds.length} projects with Resource Bookings expiring in less than 3 weeks.`)
}

/**
 * Send notification through a particular template
 * @param {Object} currentUser the user who perform this operation
 * @param {Object} data the email object
 * @param {Array} webNotifications the optional list of web notifications
 */
async function sendNotification (currentUser, data, webNotifications = []) {
  const template = emailTemplates[data.template]
  const dataCC = data.cc || []
  const templateCC = (template.cc || []).map(email => ({ email }))
  const dataRecipients = data.recipients || []
  const templateRecipients = (template.recipients || []).map(email => ({ email }))
  const subjectBody = {
    subject: data.subject || template.subject,
    body: data.body || template.body
  }
  for (const key in subjectBody) {
    subjectBody[key] = helper.substituteStringByObject(
      subjectBody[key],
      data.data
    )
  }

  const recipients = _.uniq([...dataRecipients, ...templateRecipients])
  const emailData = {
    serviceId: 'email',
    type: data.template,
    details: {
      from: data.from || template.from,
      recipients,
      cc: _.uniq([...dataCC, ...templateCC]),
      data: { ...data.data, ...subjectBody },
      sendgridTemplateId: template.sendgridTemplateId,
      version: 'v3'
    }
  }

  const notifications = [emailData, ...webNotifications]
  await helper.postEvent(config.NOTIFICATIONS_CREATE_TOPIC, {
    notifications
  })
}

// Send notifications to job candicate for time selection reminder
async function sendInterviewScheduleReminderNotifications () {
  const INTERVIEW_REMINDER_DAY_AFTER = config.get('INTERVIEW_REMINDER_DAY_AFTER')
  const INTERVIEW_REMINDER_FREQUENCY = config.get('INTERVIEW_REMINDER_FREQUENCY')

  localLogger.debug('[sendInterviewScheduleReminderNotifications]: Looking for due records...')
  const currentTime = moment.utc()
  const compareTime = currentTime.clone().subtract(moment.duration(INTERVIEW_REMINDER_DAY_AFTER)).endOf('day')

  const timestampFilter = {
    [Op.and]: [
      {
        [Op.lte]: compareTime
      }
    ]
  }

  const filter = {
    [Op.and]: [
      {
        status: {
          [Op.in]: [
            constants.Interviews.Status.Scheduling
          ]
        }
      },
      {
        createdAt: timestampFilter
      }
    ]
  }

  const interviews = await Interview.findAll({
    where: filter,
    raw: true
  })

  const template = 'taas.notification.interview-schedule-reminder'

  let interviewCount = 0
  for (const interview of interviews) {
    const start = moment(interview.createdAt)
    if (currentTime.clone().subtract(INTERVIEW_REMINDER_DAY_AFTER).diff(start, 'days') % INTERVIEW_REMINDER_FREQUENCY === 0) {
      const minutesInterval = currentTime.clone().diff(start, 'minutes') % (60 * 24)
      if (minutesInterval < moment.duration(config.INTERVIEW_SCHEDULE_REMINDER_WINDOW).minutes()) {
        // sendEmail
        const data = await getDataForInterview(interview)
        if (!data) { continue }

        if (!_.isEmpty(data.guestEmail)) {
          // send guest emails
          sendNotification({}, {
            template,
            recipients: [{ email: data.guestEmail }],
            data: {
              ...data,
              subject: `Reminder: ${data.duration} minutes tech interview with ${data.guestFullName} for ${data.jobTitle} is requested by the Customer`
            }
          })
        } else {
          localLogger.error(`Interview id: ${interview.id} guest emails not present`, 'sendInterviewScheduleReminderNotifications')
        }
        interviewCount++
      }
    }
  }

  localLogger.debug(`[sendInterviewScheduleReminderNotifications]: Sent notifications for ${interviewCount} interviews which need to schedule.`)
}

// Send notifications to customer and candidate this interview has expired
async function sendInterviewExpiredNotifications () {
  localLogger.debug('[sendInterviewExpiredNotifications]: Looking for due records...')
  const currentTime = moment.utc().startOf('minute')

  const timestampFilter = {
    [Op.and]: [
      {
        [Op.lte]: currentTime
      }
    ]
  }

  const filter = {
    [Op.and]: [
      {
        status: {
          [Op.in]: [
            constants.Interviews.Status.Scheduling
          ]
        }
      },
      {
        expireTimestamp: timestampFilter
      }
    ]
  }

  const interviews = await Interview.findAll({
    where: filter,
    raw: true
  })

  localLogger.debug(`[sendInterviewExpiredNotifications]: Found ${interviews.length} interviews which are expired.`)

  const templateHost = 'taas.notification.interview-expired-host'
  const templateGuest = 'taas.notification.interview-expired-guest'

  for (const interview of interviews) {
    // this method is run by the app itself
    const m2mUser = getAuditM2Muser()

    await interviewService.partiallyUpdateInterviewById(
      m2mUser,
      interview.id,
      {
        status: constants.Interviews.Status.Expired
      }
    )

    // send host email
    const data = await getDataForInterview(interview)
    if (!data) { continue }

    if (!_.isEmpty(data.hostEmail)) {
      sendNotification({}, {
        template: templateHost,
        recipients: [{ email: data.hostEmail }],
        data: {
          ...data,
          subject: `Candidate Didn't Schedule Interview: ${data.duration} minutes tech interview with ${data.guestFullName} for ${data.jobTitle} is requested by the Customer`
        }
      })
    } else {
      localLogger.error(`Interview id: ${interview.id} host email not present`, 'sendInterviewExpiredNotifications')
    }

    if (!_.isEmpty(data.guestEmail)) {
      // send guest emails
      sendNotification({}, {
        template: templateGuest,
        recipients: [{ email: data.guestEmail }],
        data: {
          ...data,
          subject: `Interview Invitation Expired: ${data.duration} minutes tech interview with ${data.guestFullName} for ${data.jobTitle} is requested by the Customer`
        }
      })
    } else {
      localLogger.error(`Interview id: ${interview.id} guest emails not present`, 'sendInterviewExpiredNotifications')
    }
  }

  localLogger.debug(`[sendInterviewExpiredNotifications]: Sent notifications for ${interviews.length} interviews which are expired.`)
}

/**
 * For preventing app crashing by scheduler function, use this function to wrapper target handler.
 * @param {*} callback : function handler
 */
function errorCatchWrapper (callback, name) {
  return async () => {
    try {
      await callback()
    } catch (e) {
      localLogger.error(`${[name]} Service function error: ${e}`)
    }
  }
}

module.exports = {
  sendNotification,
  sendCandidatesAvailableNotifications: errorCatchWrapper(sendCandidatesAvailableNotifications, 'sendCandidatesAvailableNotifications'),
  sendInterviewComingUpNotifications: errorCatchWrapper(sendInterviewComingUpNotifications, 'sendInterviewComingUpNotifications'),
  sendInterviewCompletedNotifications: errorCatchWrapper(sendInterviewCompletedNotifications, 'sendInterviewCompletedNotifications'),
  sendInterviewExpiredNotifications: errorCatchWrapper(sendInterviewExpiredNotifications, 'sendInterviewExpiredNotifications'),
  sendInterviewScheduleReminderNotifications: errorCatchWrapper(sendInterviewScheduleReminderNotifications, 'sendInterviewScheduleReminderNotifications'),
  getDataForInterview,
  sendPostInterviewActionNotifications: errorCatchWrapper(sendPostInterviewActionNotifications, 'sendPostInterviewActionNotifications'),
  sendResourceBookingExpirationNotifications: errorCatchWrapper(sendResourceBookingExpirationNotifications, 'sendResourceBookingExpirationNotifications')
}
