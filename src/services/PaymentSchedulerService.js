const _ = require('lodash')
const config = require('config')
const moment = require('moment')
const models = require('../models')
const { getV3MemberDetailsByHandle, getChallenge, getChallengeResource, sleep, postEvent } = require('../common/helper')
const logger = require('../common/logger')
const { createChallenge, addResourceToChallenge, activateChallenge, closeChallenge } = require('./PaymentService')
const { ChallengeStatus, PaymentSchedulerStatus, PaymentProcessingSwitch } = require('../../app-constants')

const WorkPeriodPayment = models.WorkPeriodPayment
const WorkPeriod = models.WorkPeriod
const PaymentScheduler = models.PaymentScheduler
const {
  SWITCH, BATCH_SIZE, IN_PROGRESS_EXPIRED, MAX_RETRY_COUNT, RETRY_BASE_DELAY, RETRY_MAX_DELAY, PER_REQUEST_MAX_TIME, PER_PAYMENT_MAX_TIME,
  PER_MINUTE_PAYMENT_MAX_COUNT, PER_MINUTE_CHALLENGE_REQUEST_MAX_COUNT, PER_MINUTE_RESOURCE_REQUEST_MAX_COUNT,
  FIX_DELAY_STEP_CREATE_CHALLENGE, FIX_DELAY_STEP_ASSIGN_MEMBER, FIX_DELAY_STEP_ACTIVATE_CHALLENGE
} = config.PAYMENT_PROCESSING
const processStatus = {
  perMin: {
    minute: '0:0',
    paymentsProcessed: 0,
    challengeRequested: 0,
    resourceRequested: 0
  },
  perMinThreshold: {
    paymentsProcessed: PER_MINUTE_PAYMENT_MAX_COUNT,
    challengeRequested: PER_MINUTE_CHALLENGE_REQUEST_MAX_COUNT,
    resourceRequested: PER_MINUTE_RESOURCE_REQUEST_MAX_COUNT
  },
  paymentStartTime: 0,
  requestStartTime: 0
}
const processResult = {
  SUCCESS: 'success',
  FAIL: 'fail',
  SKIP: 'skip'
}

const localLogger = {
  debug: (message, context) => logger.debug({ component: 'PaymentSchedulerService', context, message }),
  error: (message, context) => logger.error({ component: 'PaymentSchedulerService', context, message }),
  info: (message, context) => logger.info({ component: 'PaymentSchedulerService', context, message })
}

/**
 * Scheduler process entrance
 */
async function processScheduler () {
  // Get the oldest Work Periods Payment records in status "scheduled" and "in-progress",
  // the in progress state may be caused by an abnormal shutdown,
  // or it may be a normal record that is still being processed
  const workPeriodPaymentList = await WorkPeriodPayment.findAll({ where: { status: ['in-progress', 'scheduled'] }, order: [['status', 'desc'], ['createdAt']], limit: BATCH_SIZE })
  localLogger.info(`start processing ${workPeriodPaymentList.length} of payments`, 'processScheduler')
  const failIds = []
  const skipIds = []
  for (const workPeriodPayment of workPeriodPaymentList) {
    const result = await processPayment(workPeriodPayment)
    if (result === processResult.FAIL) {
      failIds.push(workPeriodPayment.id)
    } else if (result === processResult.SKIP) {
      skipIds.push(workPeriodPayment.id)
    }
  }
  localLogger.info(`process end. ${workPeriodPaymentList.length - failIds.length - skipIds.length} of payments processed successfully`, 'processScheduler')
  if (!_.isEmpty(skipIds)) {
    localLogger.info(`payments: ${_.join(skipIds, ',')} are processing by other processor`, 'processScheduler')
  }
  if (!_.isEmpty(failIds)) {
    localLogger.error(`payments: ${_.join(failIds, ',')} are processed failed`, 'processScheduler')
  }
}

/**
 * Process a record of payment
 * @param {Object} workPeriodPayment the work period payment
 * @returns {String} process result
 */
async function processPayment (workPeriodPayment) {
  processStatus.paymentStartTime = Date.now()
  let paymentScheduler
  if (workPeriodPayment.status === 'in-progress') {
    paymentScheduler = await PaymentScheduler.findOne({ where: { workPeriodPaymentId: workPeriodPayment.id, status: 'in-progress' } })

    // If the in-progress record has not expired, it is considered to be being processed by other processes
    if (paymentScheduler && moment(paymentScheduler.updatedAt).add(moment.duration(IN_PROGRESS_EXPIRED)).isAfter(moment())) {
      localLogger.info(`workPeriodPayment: ${workPeriodPayment.id} is being processed by other processor`, 'processPayment')
      return processResult.SKIP
    }
  } else {
    const oldValue = workPeriodPayment.toJSON()
    const updated = await workPeriodPayment.update({ status: 'in-progress' })
    // Update the modified status to es
    await postEvent(config.TAAS_WORK_PERIOD_PAYMENT_UPDATE_TOPIC, updated.toJSON(), { oldValue })
  }
  // Check whether the number of processed records per minute exceeds the specified number, if it exceeds, wait for the next minute before processing
  await checkWait(PaymentSchedulerStatus.START_PROCESS)
  localLogger.info(`Processing workPeriodPayment ${workPeriodPayment.id}`, 'processPayment')

  const workPeriod = await WorkPeriod.findById(workPeriodPayment.workPeriodId)
  try {
    if (!paymentScheduler) {
      // 1. create challenge
      const challengeId = await withRetry(createChallenge, [getCreateChallengeParam(workPeriod, workPeriodPayment)], validateError, PaymentSchedulerStatus.CREATE_CHALLENGE)
      paymentScheduler = await PaymentScheduler.create({ challengeId, step: 1, workPeriodPaymentId: workPeriodPayment.id, userHandle: workPeriod.userHandle, status: 'in-progress' })
    } else {
      // If the paymentScheduler already exists, it means that this is a record caused by an abnormal shutdown
      await setPaymentSchedulerStep(paymentScheduler)
    }
    // Start from unprocessed step, perform the process step by step
    while (paymentScheduler.step !== PaymentSchedulerStatus.CLOSE_CHALLENGE) {
      await processStep(paymentScheduler)
    }

    const oldValue = workPeriodPayment.toJSON()
    // 5. update wp and save  it should only update already existent Work Period Payment record with created "challengeId" and "status=completed".
    const updated = await workPeriodPayment.update({ challengeId: paymentScheduler.challengeId, status: 'completed' })
    // Update the modified status to es
    await postEvent(config.TAAS_WORK_PERIOD_PAYMENT_UPDATE_TOPIC, updated.toJSON(), { oldValue })

    await paymentScheduler.update({ step: PaymentSchedulerStatus.CLOSE_CHALLENGE, userId: paymentScheduler.userId, status: 'completed' })

    localLogger.info(`Processed workPeriodPayment ${workPeriodPayment.id} successfully`, 'processPayment')
    return processResult.SUCCESS
  } catch (err) {
    logger.logFullError(err, { component: 'PaymentSchedulerService', context: 'processPayment' })
    const statusDetails = { errorMessage: err.message, errorCode: _.get(err, 'status', -1), retry: _.get(err, 'retry', -1), step: _.get(err, 'step'), challengeId: paymentScheduler ? paymentScheduler.challengeId : null }
    const oldValue = workPeriodPayment.toJSON()
    // If payment processing failed Work Periods Payment "status" should be changed to "failed" and populate "statusDetails" field with error details in JSON format.
    const updated = await workPeriodPayment.update({ statusDetails, status: 'failed' })
    // Update the modified status to es
    await postEvent(config.TAAS_WORK_PERIOD_PAYMENT_UPDATE_TOPIC, updated.toJSON(), { oldValue })

    if (paymentScheduler) {
      await paymentScheduler.update({ step: PaymentSchedulerStatus.CLOSE_CHALLENGE, userId: paymentScheduler.userId, status: 'failed' })
    }
    localLogger.error(`Processed workPeriodPayment ${workPeriodPayment.id} failed`, 'processPayment')
    return processResult.FAIL
  }
}

/**
 * Perform a specific step in the process
 * @param {Object} paymentScheduler the payment scheduler
 */
async function processStep (paymentScheduler) {
  if (paymentScheduler.step === PaymentSchedulerStatus.CREATE_CHALLENGE) {
    // 2. assign member to the challenge
    await withRetry(addResourceToChallenge, [paymentScheduler.challengeId, paymentScheduler.userHandle], validateError, PaymentSchedulerStatus.ASSIGN_MEMBER)
    paymentScheduler.step = PaymentSchedulerStatus.ASSIGN_MEMBER
  } else if (paymentScheduler.step === PaymentSchedulerStatus.ASSIGN_MEMBER) {
    // 3. active the challenge
    await withRetry(activateChallenge, [paymentScheduler.challengeId], validateError, PaymentSchedulerStatus.ACTIVATE_CHALLENGE)
    paymentScheduler.step = PaymentSchedulerStatus.ACTIVATE_CHALLENGE
  } else if (paymentScheduler.step === PaymentSchedulerStatus.ACTIVATE_CHALLENGE) {
    // 4.1. get user id
    const { userId } = await withRetry(getV3MemberDetailsByHandle, [paymentScheduler.userHandle], validateError, PaymentSchedulerStatus.GET_USER_ID)
    paymentScheduler.userId = userId
    paymentScheduler.step = PaymentSchedulerStatus.GET_USER_ID
  } else if (paymentScheduler.step === PaymentSchedulerStatus.GET_USER_ID) {
    // 4.2. close the challenge
    await withRetry(closeChallenge, [paymentScheduler.challengeId, paymentScheduler.userId, paymentScheduler.userHandle], validateError, PaymentSchedulerStatus.CLOSE_CHALLENGE)
    paymentScheduler.step = PaymentSchedulerStatus.CLOSE_CHALLENGE
  }
}

/**
 * Set the scheduler actual step
 * @param {Object} paymentScheduler the scheduler object
 */
async function setPaymentSchedulerStep (paymentScheduler) {
  const challenge = await getChallenge(paymentScheduler.challengeId)
  if (SWITCH === PaymentProcessingSwitch.OFF) {
    paymentScheduler.step = PaymentSchedulerStatus.CLOSE_CHALLENGE
  } else if (challenge.status === ChallengeStatus.COMPLETED) {
    paymentScheduler.step = PaymentSchedulerStatus.CLOSE_CHALLENGE
  } else if (challenge.status === ChallengeStatus.ACTIVE) {
    paymentScheduler.step = PaymentSchedulerStatus.ACTIVATE_CHALLENGE
  } else {
    const resource = await getChallengeResource(paymentScheduler.challengeId, paymentScheduler.userHandle, config.ROLE_ID_SUBMITTER)
    if (resource) {
      paymentScheduler.step = PaymentSchedulerStatus.ASSIGN_MEMBER
    } else {
      paymentScheduler.step = PaymentSchedulerStatus.CREATE_CHALLENGE
    }
  }
  // The main purpose is updating the updatedAt of payment scheduler to avoid simultaneous processing
  await paymentScheduler.update({ step: paymentScheduler.step })
}

/**
 * Generate the create challenge parameter
 * @param {Object} workPeriod the work period
 * @param {Object} workPeriodPayment the work period payment
 * @returns {Object} the create challenge parameter
 */
function getCreateChallengeParam (workPeriod, workPeriodPayment) {
  return {
    projectId: workPeriod.projectId,
    userHandle: workPeriod.userHandle,
    amount: workPeriodPayment.amount,
    name: `TaaS Payment - ${workPeriod.userHandle} - Week Ending ${moment(workPeriod.endDate).format('D/M/YYYY')}`,
    description: `TaaS Payment - ${workPeriod.userHandle} - Week Ending ${moment(workPeriod.endDate).format('D/M/YYYY')}`,
    billingAccountId: workPeriodPayment.billingAccountId
  }
}

/**
 * Before each step is processed, wait for the corresponding time
 * @param {String} step the step name
 * @param {Number} tryCount the try count
 */
async function checkWait (step, tryCount) {
  // When calculating the retry time later, we need to subtract the time that has been waited before
  let lapse = 0
  if (step === PaymentSchedulerStatus.START_PROCESS) {
    lapse += await checkPerMinThreshold('paymentsProcessed')
  } else if (step === PaymentSchedulerStatus.CREATE_CHALLENGE) {
    await checkPerMinThreshold('challengeRequested')
  } else if (step === PaymentSchedulerStatus.ASSIGN_MEMBER) {
    // Only when tryCount = 0, it comes from the previous step, and it is necessary to wait for a fixed time
    if (FIX_DELAY_STEP_CREATE_CHALLENGE > 0 && tryCount === 0) {
      await sleep(FIX_DELAY_STEP_CREATE_CHALLENGE)
    }
    lapse += await checkPerMinThreshold('resourceRequested')
  } else if (step === PaymentSchedulerStatus.ACTIVATE_CHALLENGE) {
    // Only when tryCount = 0, it comes from the previous step, and it is necessary to wait for a fixed time
    if (FIX_DELAY_STEP_ASSIGN_MEMBER > 0 && tryCount === 0) {
      await sleep(FIX_DELAY_STEP_ASSIGN_MEMBER)
    }
    lapse += await checkPerMinThreshold('challengeRequested')
  } else if (step === PaymentSchedulerStatus.CLOSE_CHALLENGE) {
    // Only when tryCount = 0, it comes from the previous step, and it is necessary to wait for a fixed time
    if (FIX_DELAY_STEP_ACTIVATE_CHALLENGE > 0 && tryCount === 0) {
      await sleep(FIX_DELAY_STEP_ACTIVATE_CHALLENGE)
    }
    lapse += await checkPerMinThreshold('challengeRequested')
  }

  if (tryCount > 0) {
    // exponential backoff and do not exceed the maximum retry delay
    const retryDelay = Math.min(RETRY_BASE_DELAY * Math.pow(2, tryCount), RETRY_MAX_DELAY)
    await sleep(retryDelay - lapse)
  }
}

/**
 * Determine whether the number of records processed every minute exceeds the specified number, if it exceeds, wait for the next minute
 * @param {String} key the min threshold key
 * @returns {Number} wait time
 */
async function checkPerMinThreshold (key) {
  const mt = moment()
  const min = mt.format('h:m')
  let waitMs = 0
  if (processStatus.perMin.minute === min) {
    if (processStatus.perMin[key] >= processStatus.perMinThreshold[key]) {
      waitMs = (60 - mt.seconds()) * 1000
      localLogger.info(`The number of records of ${key} processed per minute reaches ${processStatus.perMinThreshold[key]}, and it need to wait for ${60 - mt.seconds()} seconds until the next minute`)
      await sleep(waitMs)
      processStatus.perMin = {
        minute: moment().format('h:m'),
        paymentsProcessed: 0,
        challengeRequested: 0,
        resourceRequested: 0
      }
    }
  } else {
    processStatus.perMin = {
      minute: min,
      paymentsProcessed: 0,
      challengeRequested: 0,
      resourceRequested: 0
    }
  }
  processStatus.perMin[key]++
  return waitMs
}

/**
 * Determine whether it can try again
 * @param {Object} err the process error
 * @returns {Boolean}
 */
function validateError (err) {
  return !err.status || err.status >= 500
}

/**
 * Execute the function, if an exception occurs, retry according to the conditions
 * @param {Function} func the main function
 * @param {Array} argArr the args of main function
 * @param {Function} predictFunc the determine error function
 * @param {String} step the step name
 * @returns the result of main function
 */
async function withRetry (func, argArr, predictFunc, step) {
  let tryCount = 0
  processStatus.requestStartTime = Date.now()
  while (true) {
    await checkWait(step, tryCount)
    tryCount++
    try {
      // mock code
      if (SWITCH === PaymentProcessingSwitch.OFF) {
        // without actual API calls by adding delay (for example 1 second for each step), to simulate the act
        sleep(1000)
        if (step === PaymentSchedulerStatus.CREATE_CHALLENGE) {
          return '00000000-0000-0000-0000-000000000000'
        } else if (step === PaymentSchedulerStatus.GET_USER_ID) {
          return { userId: 100001 }
        }
        return
      } else {
        // Execute the main function
        const result = await func(...argArr)
        return result
      }
    } catch (err) {
      const now = Date.now()
      // The following is the case of not retrying:
      // 1. The number of retries exceeds the configured number
      // 2. The thrown error does not match the retry conditions
      // 3. The request execution time exceeds the configured time
      // 4. The processing time of the payment record exceeds the configured time
      if (tryCount > MAX_RETRY_COUNT || !predictFunc(err) || now - processStatus.requestStartTime > PER_REQUEST_MAX_TIME || now - processStatus.paymentStartTime > PER_PAYMENT_MAX_TIME) {
        err.retry = tryCount
        err.step = step
        throw err
      }
      localLogger.info(`execute ${step} with error: ${err.message}, retry...`, 'withRetry')
    }
  }
}

module.exports = {
  processScheduler
}
