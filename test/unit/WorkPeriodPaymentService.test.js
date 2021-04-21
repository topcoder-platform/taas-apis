/* eslint-disable no-unused-expressions */

// const _ = require('lodash')
const expect = require('chai').expect
const sinon = require('sinon')
const models = require('../../src/models')
const service = require('../../src/services/WorkPeriodPaymentService')
const paymentService = require('../../src/services/PaymentService')
const testData = require('./common/testData')
const helper = require('../../src/common/helper')
// const esClient = helper.getESClient()
const busApiClient = helper.getBusApiClient()
describe('workPeriod service test', () => {
  beforeEach(() => {
    sinon.stub(busApiClient, 'postEvent').callsFake(async () => {})
  })

  afterEach(() => {
    sinon.restore()
  })

  describe('create work period test', () => {
    describe('when PAYMENT_PROCESSING_SWITCH is ON/OFF', async () => {
      let stubCreatePaymentService

      beforeEach(async () => {
        sinon.stub(helper, 'ensureWorkPeriodById').callsFake(async () => testData.workPeriodPayment01.ensureWorkPeriodByIdResponse)
        sinon.stub(helper, 'getUserId').callsFake(async () => {})
        sinon.stub(models.WorkPeriodPayment, 'create').callsFake(() => testData.workPeriodPayment01.response)
        stubCreatePaymentService = sinon.stub(paymentService, 'createPayment').callsFake(async () => testData.workPeriodPayment01.createPaymentResponse)
      })

      it('do not create payment if PAYMENT_PROCESSING_SWITCH is OFF', async () => {
        await service.createWorkPeriodPayment(testData.currentUser, testData.workPeriodPayment01.request, { paymentProcessingSwitch: 'OFF' })
        expect(stubCreatePaymentService.calledOnce).to.be.false
      })
      it('create payment if PAYMENT_PROCESSING_SWITCH is ON', async () => {
        await service.createWorkPeriodPayment(testData.currentUser, testData.workPeriodPayment01.request, { paymentProcessingSwitch: 'ON' })
        expect(stubCreatePaymentService.calledOnce).to.be.true
      })
    })
  })
})
