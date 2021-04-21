/* eslint-disable no-unused-expressions */
process.env.NODE_ENV = 'test'
require('../../src/bootstrap')

// const _ = require('lodash')
const expect = require('chai').expect
const sinon = require('sinon')
const models = require('../../src/models')
const service = require('../../src/services/ResourceBookingService')
const workPeriodService = require('../../src/services/WorkPeriodService')
const testData = require('./common/testData')
const helper = require('../../src/common/helper')
const eventHandlers = require('../../src/eventHandlers')
// const esClient = helper.getESClient()
const busApiClient = helper.getBusApiClient()
const ResourceBooking = models.ResourceBooking
const WorkPeriod = models.WorkPeriod
eventHandlers.init()
describe('resourceBooking service test', () => {
  let stubEnsureJobById
  let stubEnsureUserById
  let stubPostEvent
  let stubCreateWorkPeriodService
  let stubUpdateWorkPeriodService
  let stubDeleteWorkPeriodService
  beforeEach(() => {
    stubEnsureJobById = sinon.stub(helper, 'ensureJobById').callsFake(async () => {})
    stubEnsureUserById = sinon.stub(helper, 'ensureUserById').callsFake(async () => testData.UserTCConnCopilot)
    stubPostEvent = sinon.stub(busApiClient, 'postEvent').callsFake(async () => {})
    stubCreateWorkPeriodService = sinon.stub(workPeriodService, 'createWorkPeriod').callsFake(async () => {})
    stubUpdateWorkPeriodService = sinon.stub(workPeriodService, 'partiallyUpdateWorkPeriod').callsFake(async () => {})
    stubDeleteWorkPeriodService = sinon.stub(workPeriodService, 'deleteWorkPeriod').callsFake(async () => {})
  })

  afterEach(() => {
    sinon.restore()
  })

  describe('create resource booking test', () => {
    it('create resource booking and auto populate work periods for 5 weeks', async () => {
      const stubDBCreate = sinon.stub(ResourceBooking, 'create').callsFake(() => {
        return testData.resourceBooking5Week.response
      })
      const entity = await service.createResourceBooking(testData.currentUser, testData.resourceBooking5Week.request)
      expect(entity).to.deep.eql(testData.resourceBooking5Week.response.toJSON())
      expect(stubEnsureJobById.calledOnce).to.be.true
      expect(stubEnsureUserById.calledOnce).to.be.true
      expect(stubDBCreate.calledOnce).to.be.true
      expect(stubPostEvent.calledOnce).to.be.true
      expect(stubCreateWorkPeriodService.callCount).to.eq(5)
      expect(stubCreateWorkPeriodService.getCall(0).args[1]).to.deep.eq(testData.resourceBooking5Week.workPeriodRequests[0])
      expect(stubCreateWorkPeriodService.getCall(1).args[1]).to.deep.eq(testData.resourceBooking5Week.workPeriodRequests[1])
      expect(stubCreateWorkPeriodService.getCall(2).args[1]).to.deep.eq(testData.resourceBooking5Week.workPeriodRequests[2])
      expect(stubCreateWorkPeriodService.getCall(3).args[1]).to.deep.eq(testData.resourceBooking5Week.workPeriodRequests[3])
      expect(stubCreateWorkPeriodService.getCall(4).args[1]).to.deep.eq(testData.resourceBooking5Week.workPeriodRequests[4])
    })
    it('create resource booking and auto populate work periods for 1 week', async () => {
      const stubDBCreate = sinon.stub(ResourceBooking, 'create').callsFake(async () => {
        return testData.resourceBooking1Week.response
      })

      const entity = await service.createResourceBooking(testData.currentUser, testData.resourceBooking1Week.request)
      expect(entity).to.deep.eql(testData.resourceBooking1Week.response.toJSON())
      expect(stubEnsureJobById.calledOnce).to.be.true
      expect(stubEnsureUserById.calledOnce).to.be.true
      expect(stubDBCreate.calledOnce).to.be.true
      expect(stubPostEvent.calledOnce).to.be.true
      expect(stubCreateWorkPeriodService.callCount).to.eq(1)
      expect(stubUpdateWorkPeriodService.callCount).to.eq(0)
      expect(stubDeleteWorkPeriodService.callCount).to.eq(0)
      expect(stubCreateWorkPeriodService.getCall(0).args[1]).to.deep.eq(testData.resourceBooking1Week.workPeriodRequests[0])
    })
    it('update resource booking and cause daysWorked to change', async () => {
      const stubResourceBookingFindById = sinon.stub(ResourceBooking, 'findById').callsFake(async () => {
        return testData.resourceBooking1Week.response
      })
      const stubWorkPeriodFindAll = sinon.stub(WorkPeriod, 'findAll').callsFake(async () => {
        return testData.resourceBooking1Week.workPeriodResponse
      })
      const entity = await service.partiallyUpdateResourceBooking(testData.currentUser, testData.resourceBooking1Week.response.dataValues.id, testData.resourceBooking1Week.updateRequest)
      expect(entity).to.deep.eql(testData.resourceBooking1Week.updateResponse.toJSON())
      expect(stubResourceBookingFindById.calledOnce).to.be.true
      expect(stubPostEvent.calledOnce).to.be.true
      expect(stubWorkPeriodFindAll.called).to.be.true
      expect(stubCreateWorkPeriodService.callCount).to.eq(0)
      expect(stubUpdateWorkPeriodService.callCount).to.eq(1)
      expect(stubDeleteWorkPeriodService.callCount).to.eq(0)
      expect(stubUpdateWorkPeriodService.getCall(0).args[2]).to.deep.eq(testData.resourceBooking1Week.workPeriodUpdateRequests[0])
    })
    it('update resource booking and cause daysWorked to change', async () => {
      const stubResourceBookingFindById = sinon.stub(ResourceBooking, 'findById').callsFake(async () => {
        return testData.resourceBookingUpdate.response
      })
      const stubWorkPeriodFindAll = sinon.stub(WorkPeriod, 'findAll').callsFake(async () => {
        return testData.resourceBookingUpdate.workPeriodResponse
      })
      const entity = await service.partiallyUpdateResourceBooking(testData.currentUser, testData.resourceBookingUpdate.response.dataValues.id, testData.resourceBookingUpdate.updateRequest)
      expect(entity).to.deep.eql(testData.resourceBookingUpdate.updateResponse.toJSON())
      expect(stubResourceBookingFindById.calledOnce).to.be.true
      expect(stubPostEvent.calledOnce).to.be.true
      expect(stubWorkPeriodFindAll.called).to.be.true
      expect(stubCreateWorkPeriodService.callCount).to.eq(0)
      expect(stubUpdateWorkPeriodService.callCount).to.eq(1)
      expect(stubDeleteWorkPeriodService.callCount).to.eq(0)
      expect(stubUpdateWorkPeriodService.getCall(0).args[2]).to.deep.eq(testData.resourceBookingUpdate.workPeriodUpdateRequests[0])
    })
    it('update resource booking and cause workPeriod to create', async () => {
      const stubResourceBookingFindById = sinon.stub(ResourceBooking, 'findById').callsFake(async () => {
        return testData.resourceBookingUpdate.response2
      })
      const stubWorkPeriodFindAll = sinon.stub(WorkPeriod, 'findAll').callsFake(async () => {
        return testData.resourceBookingUpdate.workPeriodResponse
      })
      const entity = await service.partiallyUpdateResourceBooking(testData.currentUser, testData.resourceBookingUpdate.response2.dataValues.id, testData.resourceBookingUpdate.updateRequest2)
      expect(entity).to.deep.eql(testData.resourceBookingUpdate.updateResponse2.toJSON())
      expect(stubResourceBookingFindById.calledOnce).to.be.true
      expect(stubPostEvent.calledOnce).to.be.true
      expect(stubWorkPeriodFindAll.called).to.be.true
      expect(stubCreateWorkPeriodService.callCount).to.eq(1)
      expect(stubUpdateWorkPeriodService.callCount).to.eq(1)
      expect(stubDeleteWorkPeriodService.callCount).to.eq(0)
      expect(stubUpdateWorkPeriodService.getCall(0).args[2]).to.deep.eq(testData.resourceBookingUpdate.workPeriodUpdateRequests2[0])
      expect(stubCreateWorkPeriodService.getCall(0).args[1]).to.deep.eq(testData.resourceBookingUpdate.workPeriodUpdateRequests2[1])
    })
    it('update resource booking and cause workPeriod to delete', async () => {
      const stubResourceBookingFindById = sinon.stub(ResourceBooking, 'findById').callsFake(async () => {
        return testData.resourceBookingUpdate.response3
      })
      const stubWorkPeriodFindAll = sinon.stub(WorkPeriod, 'findAll').callsFake(async () => {
        return testData.resourceBookingUpdate.workPeriodResponse
      })
      const entity = await service.partiallyUpdateResourceBooking(testData.currentUser, testData.resourceBookingUpdate.response3.dataValues.id, testData.resourceBookingUpdate.updateRequest3)
      expect(entity).to.deep.eql(testData.resourceBookingUpdate.updateResponse3.toJSON())
      expect(stubResourceBookingFindById.calledOnce).to.be.true
      expect(stubPostEvent.calledOnce).to.be.true
      expect(stubWorkPeriodFindAll.called).to.be.true
      expect(stubCreateWorkPeriodService.callCount).to.eq(0)
      expect(stubUpdateWorkPeriodService.callCount).to.eq(1)
      expect(stubDeleteWorkPeriodService.callCount).to.eq(1)
      expect(stubUpdateWorkPeriodService.getCall(0).args[1]).to.deep.eq(testData.resourceBookingUpdate.workPeriodUpdateRequests3[0])
      expect(stubUpdateWorkPeriodService.getCall(0).args[2]).to.deep.eq(testData.resourceBookingUpdate.workPeriodUpdateRequests3[1])
      expect(stubDeleteWorkPeriodService.getCall(0).args[1]).to.deep.eq(testData.resourceBookingUpdate.workPeriodUpdateRequests3[2])
    })
    it('delete resource booking and cause workPeriod to delete', async () => {
      const stubResourceBookingFindById = sinon.stub(ResourceBooking, 'findById').callsFake(async () => {
        return testData.resourceBookingUpdate.response3
      })
      const stubWorkPeriodFindAll = sinon.stub(WorkPeriod, 'findAll').callsFake(async () => {
        return testData.resourceBookingUpdate.workPeriodResponse
      })
      await service.deleteResourceBooking(testData.currentUser, testData.resourceBookingUpdate.response3.dataValues.id)
      expect(stubResourceBookingFindById.calledOnce).to.be.true
      expect(stubPostEvent.calledOnce).to.be.true
      expect(stubWorkPeriodFindAll.called).to.be.true
      expect(stubCreateWorkPeriodService.callCount).to.eq(0)
      expect(stubUpdateWorkPeriodService.callCount).to.eq(0)
      expect(stubDeleteWorkPeriodService.callCount).to.eq(4)
      expect(stubDeleteWorkPeriodService.getCall(0).args[1]).to.deep.eq(testData.resourceBookingUpdate.workPeriodUpdateRequests3[3])
      expect(stubDeleteWorkPeriodService.getCall(1).args[1]).to.deep.eq(testData.resourceBookingUpdate.workPeriodUpdateRequests3[4])
      expect(stubDeleteWorkPeriodService.getCall(2).args[1]).to.deep.eq(testData.resourceBookingUpdate.workPeriodUpdateRequests3[5])
      expect(stubDeleteWorkPeriodService.getCall(3).args[1]).to.deep.eq(testData.resourceBookingUpdate.workPeriodUpdateRequests3[6])
    })
    it('update resource booking with paid weeks and cause workPeriod to delete', async () => {
      const stubResourceBookingFindById = sinon.stub(ResourceBooking, 'findById').callsFake(async () => {
        return testData.resourceBookingUpdate.response4
      })
      const stubWorkPeriodFindAll = sinon.stub(WorkPeriod, 'findAll').callsFake(async () => {
        return testData.resourceBookingUpdate.workPeriodResponse4
      })
      const entity = await service.partiallyUpdateResourceBooking(testData.currentUser, testData.resourceBookingUpdate.response4.dataValues.id, testData.resourceBookingUpdate.updateRequest4)
      expect(entity).to.deep.eql(testData.resourceBookingUpdate.updateResponse4.toJSON())
      expect(stubResourceBookingFindById.calledOnce).to.be.true
      expect(stubPostEvent.calledOnce).to.be.true
      expect(stubWorkPeriodFindAll.called).to.be.true
      expect(stubCreateWorkPeriodService.callCount).to.eq(0)
      expect(stubUpdateWorkPeriodService.callCount).to.eq(1)
      expect(stubDeleteWorkPeriodService.callCount).to.eq(2)
      expect(stubUpdateWorkPeriodService.getCall(0).args[2]).to.deep.eq(testData.resourceBookingUpdate.workPeriodUpdateRequests4[0])
      expect(stubDeleteWorkPeriodService.getCall(0).args[1]).to.deep.eq(testData.resourceBookingUpdate.workPeriodUpdateRequests4[1])
      expect(stubDeleteWorkPeriodService.getCall(1).args[1]).to.deep.eq(testData.resourceBookingUpdate.workPeriodUpdateRequests4[2])
    })
    it('fail to update resource booking with paid weeks when try to delete paid weeks', async () => {
      const stubResourceBookingFindById = sinon.stub(ResourceBooking, 'findById').callsFake(async () => {
        return testData.resourceBookingUpdate.response4
      })
      const stubWorkPeriodFindAll = sinon.stub(WorkPeriod, 'findAll').callsFake(async () => {
        return testData.resourceBookingUpdate.workPeriodResponse4
      })
      let httpStatus
      try {
        await service.partiallyUpdateResourceBooking(testData.currentUser, testData.resourceBookingUpdate.response4.dataValues.id, testData.resourceBookingUpdate.updateRequest5)
      } catch (err) {
        httpStatus = err.httpStatus
      }
      expect(httpStatus).to.eq(400)
      expect(stubResourceBookingFindById.calledOnce).to.be.true
      expect(stubPostEvent.calledOnce).to.be.false
      expect(stubWorkPeriodFindAll.called).to.be.true
      expect(stubCreateWorkPeriodService.callCount).to.eq(0)
      expect(stubUpdateWorkPeriodService.callCount).to.eq(0)
      expect(stubDeleteWorkPeriodService.callCount).to.eq(0)
    })
    it('fail to update resource booking with paid weeks when try to set status cancelled', async () => {
      const stubResourceBookingFindById = sinon.stub(ResourceBooking, 'findById').callsFake(async () => {
        return testData.resourceBookingUpdate.response4
      })
      const stubWorkPeriodFindAll = sinon.stub(WorkPeriod, 'findAll').callsFake(async () => {
        return testData.resourceBookingUpdate.workPeriodResponse4
      })
      let httpStatus
      try {
        await service.partiallyUpdateResourceBooking(testData.currentUser, testData.resourceBookingUpdate.response4.dataValues.id, testData.resourceBookingUpdate.updateRequest6)
      } catch (err) {
        httpStatus = err.httpStatus
      }
      expect(httpStatus).to.eq(400)
      expect(stubResourceBookingFindById.calledOnce).to.be.true
      expect(stubPostEvent.calledOnce).to.be.false
      expect(stubWorkPeriodFindAll.called).to.be.true
      expect(stubCreateWorkPeriodService.callCount).to.eq(0)
      expect(stubUpdateWorkPeriodService.callCount).to.eq(0)
      expect(stubDeleteWorkPeriodService.callCount).to.eq(0)
    })
    it('fail to delete resource booking with paid weeks', async () => {
      const stubResourceBookingFindById = sinon.stub(ResourceBooking, 'findById').callsFake(async () => {
        return testData.resourceBookingUpdate.response4
      })
      const stubWorkPeriodFindAll = sinon.stub(WorkPeriod, 'findAll').callsFake(async () => {
        return testData.resourceBookingUpdate.workPeriodResponse4
      })
      let httpStatus
      try {
        await service.deleteResourceBooking(testData.currentUser, testData.resourceBookingUpdate.response4.dataValues.id)
      } catch (err) {
        httpStatus = err.httpStatus
      }
      expect(httpStatus).to.eq(400)
      expect(stubResourceBookingFindById.calledOnce).to.be.false
      expect(stubPostEvent.calledOnce).to.be.false
      expect(stubWorkPeriodFindAll.called).to.be.true
      expect(stubCreateWorkPeriodService.callCount).to.eq(0)
      expect(stubUpdateWorkPeriodService.callCount).to.eq(0)
      expect(stubDeleteWorkPeriodService.callCount).to.eq(0)
    })
  })
})
