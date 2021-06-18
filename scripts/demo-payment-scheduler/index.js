const { v4: uuid } = require('uuid')
const config = require('config')
const _ = require('lodash')
const data = require('./data.json')
const model = require('../../src/models')
const logger = require('../../src/common/logger')

const payments = []
for (let i = 0; i < 1000; i++) {
  payments.push({
    id: uuid(),
    workPeriodId: data.WorkPeriods[_.random(3)].id,
    amount: _.round(_.random(1000, true), 2),
    status: 'scheduled',
    billingAccountId: data.ResourceBooking.billingAccountId,
    memberRate: data.ResourceBooking.memberRate,
    days: 4,
    createdBy: '57646ff9-1cd3-4d3c-88ba-eb09a395366c',
    updatedBy: null,
    createdAt: `2021-05-19T21:3${i % 10}:46.507Z`,
    updatedAt: '2021-05-19T21:33:46.507Z'
  })
}

/**
 * Clear old demo data
 */
async function clearData () {
  const workPeriodIds = _.join(_.map(data.WorkPeriods, w => `'${w.id}'`), ',')
  await model.PaymentScheduler.destroy({
    where: {
      workPeriodPaymentId: {
        [model.Sequelize.Op.in]: [
          model.sequelize.literal(`select id from ${config.DB_SCHEMA_NAME}.work_period_payments where work_period_id in (${workPeriodIds})`)
        ]
      }
    },
    force: true
  })
  await model.WorkPeriodPayment.destroy({
    where: {
      workPeriodId: _.map(data.WorkPeriods, 'id')
    },
    force: true
  })
  await model.WorkPeriod.destroy({
    where: {
      id: _.map(data.WorkPeriods, 'id')
    },
    force: true
  })
  await model.ResourceBooking.destroy({
    where: {
      id: data.ResourceBooking.id
    },
    force: true
  })
  await model.Job.destroy({
    where: {
      id: data.Job.id
    },
    force: true
  })
}

/**
 * Insert payment scheduler demo data
 */
async function insertPaymentSchedulerDemoData () {
  logger.info({ component: 'payment-scheduler-demo-data', context: 'insertPaymentSchedulerDemoData', message: 'Starting to remove demo data if exists' })
  await clearData()
  logger.info({ component: 'payment-scheduler-demo-data', context: 'insertPaymentSchedulerDemoData', message: 'Data cleared' })
  await model.Job.create(data.Job)
  logger.info({ component: 'payment-scheduler-demo-data', context: 'insertPaymentSchedulerDemoData', message: `Job ${data.Job.id} created` })
  await model.ResourceBooking.create(data.ResourceBooking)
  logger.info({ component: 'payment-scheduler-demo-data', context: 'insertPaymentSchedulerDemoData', message: `ResourceBooking: ${data.ResourceBooking.id} create` })
  await model.WorkPeriod.bulkCreate(data.WorkPeriods)
  logger.info({ component: 'payment-scheduler-demo-data', context: 'insertPaymentSchedulerDemoData', message: `WorkPeriods: ${_.map(data.WorkPeriods, 'id')} created` })
  await model.WorkPeriodPayment.bulkCreate(payments)
  logger.info({ component: 'payment-scheduler-demo-data', context: 'insertPaymentSchedulerDemoData', message: `${payments.length} of WorkPeriodPayments scheduled` })
}

insertPaymentSchedulerDemoData()
