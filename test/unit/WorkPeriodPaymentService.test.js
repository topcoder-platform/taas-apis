/* eslint-disable no-unused-expressions */

// const _ = require('lodash')
const expect = require('chai').expect
const sinon = require('sinon')
const models = require('../../src/models')
const service = require('../../src/services/WorkPeriodPaymentService')
const paymentService = require('../../src/services/PaymentService')
const commonData = require('./common/CommonData')
const testData = require('./common/WorkPeriodPaymentData')
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
    let stubGetUserId
    let stubEnsureWorkPeriodById
    let stubEnsureResourceBookingById
    let stubCreateWorkPeriodPayment
    let stubCreatePayment

    beforeEach(async () => {
      stubGetUserId = sinon.stub(helper, 'getUserId').callsFake(async () => testData.workPeriodPayment01.getUserIdResponse)
      stubEnsureWorkPeriodById = sinon.stub(helper, 'ensureWorkPeriodById').callsFake(async () => testData.workPeriodPayment01.ensureWorkPeriodByIdResponse)
      stubEnsureResourceBookingById = sinon.stub(helper, 'ensureResourceBookingById').callsFake(async () => testData.workPeriodPayment01.ensureResourceBookingByIdResponse)
      stubCreateWorkPeriodPayment = sinon.stub(models.WorkPeriodPayment, 'create').callsFake(() => testData.workPeriodPayment01.response)
      stubCreatePayment = sinon.stub(paymentService, 'createPayment').callsFake(async () => testData.workPeriodPayment01.createPaymentResponse)
    })

    it('create work period success', async () => {
      const response = await service.createWorkPeriodPayment(commonData.currentUser, testData.workPeriodPayment01.request, { paymentProcessingSwitch: 'ON' })
      expect(stubGetUserId.calledOnce).to.be.true
      expect(stubEnsureWorkPeriodById.calledOnce).to.be.true
      expect(stubEnsureResourceBookingById.calledOnce).to.be.true
      expect(stubCreatePayment.calledOnce).to.be.true
      expect(stubCreateWorkPeriodPayment.calledOnce).to.be.true
      expect(response).to.eql(testData.workPeriodPayment01.response.dataValues)
    })

    it('create work period success - billingAccountId is set', async () => {
      await service.createWorkPeriodPayment(commonData.currentUser, testData.workPeriodPayment01.request, { paymentProcessingSwitch: 'ON' })
      expect(stubCreatePayment.calledOnce).to.be.true
      expect(stubCreatePayment.args[0][0]).to.include({
        billingAccountId: testData.workPeriodPayment01.ensureResourceBookingByIdResponse.billingAccountId
      })
      expect(stubCreateWorkPeriodPayment.calledOnce).to.be.true
      expect(stubCreateWorkPeriodPayment.args[0][0]).to.include({
        billingAccountId: testData.workPeriodPayment01.ensureResourceBookingByIdResponse.billingAccountId
      })
    })

    it('fail to create work period if corresponding resource booking does not have bill account', async () => {
      stubEnsureResourceBookingById.restore()
      sinon.stub(helper, 'ensureResourceBookingById').callsFake(async () => testData.workPeriodPayment01.ensureResourceBookingByIdResponse02)

      try {
        await service.createWorkPeriodPayment(commonData.currentUser, testData.workPeriodPayment01.request)
      } catch (err) {
        expect(err.message).to.include('"ResourceBooking" Billing account is not assigned to the resource booking')
      }
    })

    describe('when PAYMENT_PROCESSING_SWITCH is ON/OFF', async () => {
      it('do not create payment if PAYMENT_PROCESSING_SWITCH is OFF', async () => {
        await service.createWorkPeriodPayment(commonData.currentUser, testData.workPeriodPayment01.request, { paymentProcessingSwitch: 'OFF' })
        expect(stubCreatePayment.calledOnce).to.be.false
      })
      it('create payment if PAYMENT_PROCESSING_SWITCH is ON', async () => {
        await service.createWorkPeriodPayment(commonData.currentUser, testData.workPeriodPayment01.request, { paymentProcessingSwitch: 'ON' })
        expect(stubCreatePayment.calledOnce).to.be.true
      })
    })
  })
})
