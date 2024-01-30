const Kafka = require('no-kafka')
const fs = require('fs')
const config = require('config')
const axios = require('axios')
const _ = require('lodash')
const moment = require('moment')
const handlebars = require('handlebars')
const logger = require('../../src/common/logger')
const { Interview, JobCandidate, ResourceBooking } = require('../../src/models')
const { Interviews } = require('../../app-constants')

const consumer = new Kafka.GroupConsumer({ connectionString: process.env.KAFKA_URL, groupId: 'test-render-email' })

const localLogger = {
  debug: message => logger.debug({ component: 'render email content', context: 'test', message }),
  info: message => logger.info({ component: 'render email content', context: 'test', message })
}

const templateFileMap = {
  [config.TAAS_NOTIFICATION_JOB_CANDIDATE_RESUME_VIEWED_SENDGRID_TEMPLATE_ID]: handlebars.compile(fs.readFileSync('./data/notification-email-templates/taas.notification.job-candidate-resume-viewed.html', 'utf8')),
  [config.TAAS_NOTIFICATION_CANDIDATES_AVAILABLE_FOR_REVIEW_SENDGRID_TEMPLATE_ID]: handlebars.compile(fs.readFileSync('./data/notification-email-templates/taas.notification.candidates-available-for-review.html', 'utf8')),
  [config.TAAS_NOTIFICATION_INTERVIEW_COMING_UP_HOST_SENDGRID_TEMPLATE_ID]: handlebars.compile(fs.readFileSync('./data/notification-email-templates/taas.notification.interview-coming-up-host.html', 'utf8')),
  [config.TAAS_NOTIFICATION_INTERVIEW_COMING_UP_GUEST_SENDGRID_TEMPLATE_ID]: handlebars.compile(fs.readFileSync('./data/notification-email-templates/taas.notification.interview-coming-up-guest.html', 'utf8')),
  [config.TAAS_NOTIFICATION_INTERVIEW_AWAITS_RESOLUTION_SENDGRID_TEMPLATE_ID]: handlebars.compile(fs.readFileSync('./data/notification-email-templates/taas.notification.interview-awaits-resolution.html', 'utf8')),
  [config.TAAS_NOTIFICATION_POST_INTERVIEW_ACTION_REQUIRED_SENDGRID_TEMPLATE_ID]: handlebars.compile(fs.readFileSync('./data/notification-email-templates/taas.notification.post-interview-action-required.html', 'utf8')),
  [config.TAAS_NOTIFICATION_RESOURCE_BOOKING_EXPIRATION_SENDGRID_TEMPLATE_ID]: handlebars.compile(fs.readFileSync('./data/notification-email-templates/taas.notification.resource-booking-expiration.html', 'utf8')),
  [config.TAAS_NOTIFICATION_TEAM_CREATED_SENDGRID_TEMPLATE_ID]: handlebars.compile(fs.readFileSync('./data/notification-email-templates/taas.notification.team-created.html', 'utf8')),
  [config.TAAS_NOTIFICATION_JOB_CREATED_SENDGRID_TEMPLATE_ID]: handlebars.compile(fs.readFileSync('./data/notification-email-templates/taas.notification.job-created.html', 'utf8')),
  [config.TAAS_NOTIFICATION_INTERVIEWS_OVERLAPPING_SENDGRID_TEMPLATE_ID]: handlebars.compile(fs.readFileSync('./data/notification-email-templates/taas.notification.interviews-overlapping.html', 'utf8')),
  [config.TAAS_NOTIFICATION_JOB_CANDIDATE_SELECTED_SENDGRID_TEMPLATE_ID]: handlebars.compile(fs.readFileSync('./data/notification-email-templates/taas.notification.job-candidate-selected.html', 'utf8')),
  [config.TAAS_NOTIFICATION_RESOURCE_BOOKING_PLACED_SENDGRID_TEMPLATE_ID]: handlebars.compile(fs.readFileSync('./data/notification-email-templates/taas.notification.resource-booking-placed.html', 'utf8')),
  [config.TAAS_NOTIFICATION_INTERVIEW_SCHEDULE_REMINDER_SENDGRID_TEMPLATE_ID]: handlebars.compile(fs.readFileSync('./data/notification-email-templates/taas.notification.interview-schedule-reminder.html', 'utf8')),
  [config.TAAS_NOTIFICATION_INTERVIEW_EXPIRED_GUEST_SENDGRID_TEMPLATE_ID]: handlebars.compile(fs.readFileSync('./data/notification-email-templates/taas.notification.interview-expired-guest.html', 'utf8')),
  [config.TAAS_NOTIFICATION_INTERVIEW_EXPIRED_HOST_SENDGRID_TEMPLATE_ID]: handlebars.compile(fs.readFileSync('./data/notification-email-templates/taas.notification.interview-expired-host.html', 'utf8')),
  [config.TAAS_NOTIFICATION_INTERVIEW_INVITATION_SENDGRID_TEMPLATE_ID]: handlebars.compile(fs.readFileSync('./data/notification-email-templates/taas.notification.interview-invitation.html', 'utf8')),
  [config.TAAS_NOTIFICATION_INTERVIEW_LINK_FOR_HOST_SENDGRID_TEMPLATE_ID]: handlebars.compile(fs.readFileSync('./data/notification-email-templates/taas.notification.interview-link-for-host.html', 'utf8')),
  [config.TAAS_NOTIFICATION_INTERVIEW_LINK_FOR_GUEST_SENDGRID_TEMPLATE_ID]: handlebars.compile(fs.readFileSync('./data/notification-email-templates/taas.notification.interview-link-for-guest.html', 'utf8')),
  [config.TAAS_NOTIFICATION_INTERVIEW_RESCHEDULED_HOST_SENDGRID_TEMPLATE_ID]: handlebars.compile(fs.readFileSync('./data/notification-email-templates/taas.notification.interview-rescheduled-host.html', 'utf8')),
  [config.TAAS_NOTIFICATION_INTERVIEW_RESCHEDULED_GUEST_SENDGRID_TEMPLATE_ID]: handlebars.compile(fs.readFileSync('./data/notification-email-templates/taas.notification.interview-rescheduled-guest.html', 'utf8')),
  [config.TAAS_NOTIFICATION_INTERVIEW_CANCELLED_HOST_SENDGRID_TEMPLATE_ID]: handlebars.compile(fs.readFileSync('./data/notification-email-templates/taas.notification.interview-cancelled-host.html', 'utf8')),
  [config.TAAS_NOTIFICATION_INTERVIEW_CANCELLED_GUEST_SENDGRID_TEMPLATE_ID]: handlebars.compile(fs.readFileSync('./data/notification-email-templates/taas.notification.interview-cancelled-guest.html', 'utf8'))
}

/**
 * Reset notification records
 */
async function resetNotificationRecords () {
  // reset coming up interview records
  localLogger.info('reset coming up interview records')
  const interview = await Interview.findById('976d23a9-5710-453f-99d9-f57a588bb610')
  const startTimestamp = moment().add(moment.duration(config.INTERVIEW_COMING_UP_REMIND_TIME[0])).add(config.INTERVIEW_COMING_UP_MATCH_WINDOW).toDate()
  await interview.update({ startTimestamp, duration: 30, status: Interviews.Status.Scheduled, guestNames: ['test1', 'test2'], hostName: 'hostName', guestTimezone: 'Europe/London' })

  // reset completed interview records
  localLogger.info('reset completed interview records')
  const pastTime = moment.duration(config.INTERVIEW_COMPLETED_PAST_TIME)
  const completedStartTimestamp = moment().subtract(pastTime).add(config.INTERVIEW_COMPLETED_MATCH_WINDOW).toDate()
  const completedInterview = await Interview.findById('9efd72c3-1dc7-4ce2-9869-8cca81d0adeb')
  const duration = 30
  const completedEndTimestamp = moment(completedStartTimestamp).clone().add(30, 'm').toDate()
  await completedInterview.update({ startTimestamp: completedStartTimestamp, duration, endTimeStamp: completedEndTimestamp, status: Interviews.Status.Scheduled, guestNames: ['guest1', 'guest2'], hostName: 'hostName' })
  const completedInterview2 = await Interview.findById('3144fa65-ea1a-4bec-81b0-7cb1c8845826')
  await completedInterview2.update({ startTimestamp: completedStartTimestamp, duration, endTimeStamp: completedEndTimestamp, status: Interviews.Status.Scheduled, guestNames: ['guest1', 'guest2'], hostName: 'hostName' })
  const jobCandidateForInterview = await JobCandidate.findById('a4ea7bcf-5b99-4381-b99c-a9bd05d83a36')
  await jobCandidateForInterview.update({ status: 'interview' })

  // reset post interview candidate action reminder records
  localLogger.info('reset post interview candidate action reminder records')
  const jobCandidate = await JobCandidate.findById('827ee401-df04-42e1-abbe-7b97ce7937ff')
  await jobCandidate.update({ status: 'interview' })
  const c2Interview = await Interview.findById('3144fa65-ea1a-4bec-81b0-7cb1c8845826')
  await c2Interview.update({ startTimestamp: moment().subtract(moment.duration(config.POST_INTERVIEW_ACTION_MATCH_WINDOW)).subtract(30, 'm').toDate(), duration, endTimeStamp: completedEndTimestamp, guestNames: ['guest1', 'guest2'], hostName: 'hostName' })
  const c2InterviewR2 = await Interview.findById('b1f7ba76-640f-47e2-9463-59e51b51ec60')
  await c2InterviewR2.update({ status: 'Scheduled', startTimestamp: moment().subtract(moment.duration(config.POST_INTERVIEW_ACTION_MATCH_WINDOW)).subtract(30, 'm').toDate(), duration, endTimeStamp: completedEndTimestamp, guestNames: ['guest1', 'guest2'], hostName: 'hostName' })

  const interviewForReminder = await Interview.findById('a23e1bf2-1084-4cfe-a0d8-d83bc6fec655')
  // update hostUserId to test user phash_manager
  await interviewForReminder.update({ createdAt: moment().subtract(moment.duration(config.INTERVIEW_REMINDER_DAY_AFTER)).toDate(), hostUserId: '14848314' })

  const interviewExpired = await Interview.findById('505db942-79fe-4b6f-974c-b359e1b61967')
  await interviewExpired.update({ expireTimestamp: moment().subtract(moment.duration(1, 'days')).toDate(), hostUserId: '14848314' })

  // reset upcoming resource booking expiration records
  localLogger.info('reset upcoming resource booking expiration records')
  const resourceBooking = await ResourceBooking.findById('62c3f0c9-2bf0-4f24-8647-2c802a39cbcb')
  const testEnd = moment().add(moment.duration(config.RESOURCE_BOOKING_EXPIRY_TIME)).toDate()
  await resourceBooking.update({ endDate: testEnd })
}

/**
 * Init consumer.
 */
async function initConsumer () {
  await consumer
    .init([{
      subscriptions: [config.NOTIFICATIONS_CREATE_TOPIC],
      handler: async (messageSet, topic, partition) => {
        localLogger.debug(`Consumer handler. Topic: ${topic}, partition: ${partition}, message set length: ${messageSet.length}`)
        for (const m of messageSet) {
          const message = JSON.parse(m.message.value.toString('utf8'))
          if (!fs.existsSync('out')) {
            fs.mkdirSync('out')
          }
          if (message.payload.notifications) {
            _.forEach(_.filter(message.payload.notifications, ['serviceId', 'email']), (notification) => {
              const email = templateFileMap[notification.details.sendgridTemplateId](notification.details.data)
              fs.writeFileSync(`./out/${notification.details.data.subject.replace(/[^a-z0-9 ]/gi, '_')}-${Date.now()}.html`, email)
            })
            for (const notification of _.filter(message.payload.notifications, ['serviceId', 'slack'])) {
              if (process.env.SLACK_WEBHOOK_URL) {
                await axios.post(process.env.SLACK_WEBHOOK_URL, { text: notification.details.text, blocks: notification.details.blocks })
              }
            }
          }
        }
      }
    }])
    .then(() => {
      localLogger.info('Initialized.......')
      localLogger.info([config.NOTIFICATIONS_CREATE_TOPIC])
      localLogger.info('Kick Start.......')
    }).catch(err => {
      logger.logFullError(err, { component: 'app' })
    })
}

/**
 * Main function
 */
async function main () {
  await resetNotificationRecords()
  await initConsumer()
}

main()
