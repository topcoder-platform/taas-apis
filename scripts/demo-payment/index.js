require('../../src/bootstrap')
const logger = require('../../src/common/logger')
const paymentService = require('../../src/services/PaymentService')

const options = [
  {
    name: 'Test joi validation for projectId-1',
    content: {
      userHandle: 'pshah_manager',
      amount: 3,
      billingAccountId: 80000069,
      name: 'test payment for pshah_manager',
      description: '## test payment'
    }
  },
  {
    name: 'Test joi validation for projectId-2',
    content: {
      projectId: 'project',
      userHandle: 'pshah_manager',
      amount: 3,
      billingAccountId: 80000069,
      name: 'test payment for pshah_manager',
      description: '## test payment'
    }
  },
  {
    name: 'Test joi validation for userHandle',
    content: {
      projectId: 17234,
      amount: 3,
      billingAccountId: 80000069,
      name: 'test payment for pshah_manager',
      description: '## test payment'
    }
  },
  {
    name: 'Test joi validation for amount-1',
    content: {
      projectId: 17234,
      userHandle: 'pshah_manager',
      billingAccountId: 80000069,
      name: 'test payment for pshah_manager',
      description: '## test payment'
    }
  },
  {
    name: 'Test joi validation for amount-2',
    content: {
      projectId: 17234,
      userHandle: 'pshah_manager',
      amount: -10,
      billingAccountId: 80000069,
      name: 'test payment for pshah_manager',
      description: '## test payment'
    }
  },
  {
    name: 'Successful payment creation',
    content: {
      projectId: 17234,
      userHandle: 'pshah_manager',
      amount: 3,
      billingAccountId: 80000069,
      name: 'test payment for pshah_manager',
      description: '## test payment'
    }
  },
  {
    name: 'Successful payment creation without name and description',
    content: {
      projectId: 17234,
      userHandle: 'pshah_customer',
      amount: 2,
      billingAccountId: 80000069
    }
  },
  {
    name: 'Failing payment creation with no active billing account',
    content: {
      projectId: 16839,
      userHandle: 'pshah_customer',
      amount: 2,
      billingAccountId: 80000069,
      name: 'test payment for pshah_customer',
      description: '## test payment'
    }
  },
  {
    name: 'Failing payment creation with non existing user',
    content: {
      projectId: 17234,
      userHandle: 'eisbilir',
      amount: 2,
      billingAccountId: 80000069
    }
  }
]

const test = async () => {
  for (const option of options) {
    logger.info({ component: 'demo-payment', context: 'test', message: `Starting to create payment for: ${option.name}` })
    await paymentService.createPayment(option.content)
      .then(data => {
        logger.info({ component: 'demo-payment', context: 'test', message: `Payment successfuly created for: ${option.name}` })
      })
      // eslint-disable-next-line handle-callback-err
      .catch(err => {
        logger.error({ component: 'demo-payment', context: 'test', message: `Payment can't be created for: ${option.name}` })
      })
  }
}
// wait for bootstrap to complete it's job.
setTimeout(test, 2000)
