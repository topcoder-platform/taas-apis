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
  [config.NOTIFICATION_CLIENT_VIEWED_PROFILE_SENDGRID_TEMPLATE_ID]: handlebars.compile(fs.readFileSync('./data/candidate-was-viewed-by-client-email-template.html', 'utf8')),
  [config.NOTIFICATION_REVIEW_CANDIDATES_SENDGRID_TEMPLATE_ID]: handlebars.compile(fs.readFileSync('./data/candidates-are-available-for-review-email-template.html', 'utf8')),
  [config.NOTIFICATION_CUSTOMER_INTERVIEW_COMING_UP_SENDGRID_TEMPLATE_ID]: handlebars.compile(fs.readFileSync('./data/customer-interview-coming-up-email-template.html', 'utf8')),
  [config.NOTIFICATION_MEMBER_INTERVIEW_COMING_UP_SENDGRID_TEMPLATE_ID]: handlebars.compile(fs.readFileSync('./data/members-interview-coming-up-email-template.html', 'utf8')),
  [config.NOTIFICATION_INTERVIEW_COMPLETE_SENDGRID_TEMPLATE_ID]: handlebars.compile(fs.readFileSync('./data/interview-completed-email-template.html', 'utf8')),
  [config.NOTIFICATION_POST_INTERVIEW_ACTION_SENDGRID_TEMPLATE_ID]: handlebars.compile(fs.readFileSync('./data/post-interview-action-reminder-email-template.html', 'utf8')),
  [config.NOTIFICATION_UPCOMING_RESOURCE_BOOKING_EXPIRATION_SENDGRID_TEMPLATE_ID]: handlebars.compile(fs.readFileSync('./data/upcoming-resource-booking-expiration-email-template.html', 'utf8')),
  [config.NOTIFICATION_NEW_TEAM_CREATED_SENDGRID_TEMPLATE_ID]: handlebars.compile(fs.readFileSync('./data/new-team-created-email-template.html', 'utf8')),
  [config.NOTIFICATION_NEW_JOB_ADDED_SENDGRID_TEMPLATE_ID]: handlebars.compile(fs.readFileSync('./data/new-job-added-to-existing-project-email-template.html', 'utf8')),
  [config.NOTIFICATION_RESOURCE_BOOKING_PLACED_SENDGRID_TEMPLATE_ID]: handlebars.compile(fs.readFileSync('./data/resource-placed-email-template.html', 'utf8'))
}

/**
 * Reset notification records
 */
async function resetNotificationRecords () {
  // reset coming up interview records
  localLogger.info('reset coming up interview records')
  const interview = await Interview.findById('976d23a9-5710-453f-99d9-f57a588bb610')
  const startTimestamp = moment().add(moment.duration(config.INTERVIEW_COMING_UP_REMIND_TIME[0])).add(config.INTERVIEW_COMING_UP_MATCH_WINDOW).toDate()
  await interview.update({ startTimestamp, duration: 30, status: Interviews.Status.Scheduled, guestNames: ['test1', 'test2'], hostName: 'hostName' })

  // reset completed interview records
  localLogger.info('reset completed interview records')
  const pastTime = moment.duration(config.INTERVIEW_COMPLETED_PAST_TIME)
  const endTimestamp = moment().subtract(pastTime).add(config.INTERVIEW_COMPLETED_MATCH_WINDOW).toDate()
  const completedInterview = await Interview.findById('9efd72c3-1dc7-4ce2-9869-8cca81d0adeb')
  const duration = 30
  const completedStartTimestamp = moment().subtract(pastTime).subtract(30, 'm').toDate()
  await completedInterview.update({ startTimestamp: completedStartTimestamp, duration, endTimestamp, status: Interviews.Status.Scheduled, guestNames: ['guest1', 'guest2'], hostName: 'hostName' })

  // reset post interview candidate action reminder records
  localLogger.info('reset post interview candidate action reminder records')
  const jobCandidate = await JobCandidate.findById('881a19de-2b0c-4bb9-b36a-4cb5e223bdb5')
  await jobCandidate.update({ status: 'interview' })
  const c2Interview = await Interview.findById('077aa2ca-5b60-4ad9-a965-1b37e08a5046')
  await c2Interview.update({ startTimestamp: moment().subtract(moment.duration(config.POST_INTERVIEW_ACTION_MATCH_WINDOW)).subtract(30, 'm').toDate(), duration, endTimestamp, guestNames: ['guest1', 'guest2'], hostName: 'hostName' })
  const jobCandidateWithinOneDay = await JobCandidate.findById('827ee401-df04-42e1-abbe-7b97ce7937ff')
  await jobCandidateWithinOneDay.update({ status: 'interview' })
  const interviewWithinOneDay = await Interview.findById('3144fa65-ea1a-4bec-81b0-7cb1c8845826')
  await interviewWithinOneDay.update({ startTimestamp: completedStartTimestamp, duration, endTimestamp, guestNames: ['guest1', 'guest2'], hostName: 'hostName' })

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
              fs.writeFileSync(`./out/${notification.details.data.subject}-${Date.now()}.html`, email)
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
