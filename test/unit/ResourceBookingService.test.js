/* eslint-disable no-unused-expressions */

const expect = require('chai').expect
const sinon = require('sinon')
const models = require('../../src/models')
const service = require('../../src/services/ResourceBookingService')
const workPeriodService = require('../../src/services/WorkPeriodService')
const commonData = require('./common/CommonData')
const testData = require('./common/ResourceBookingData')
const helper = require('../../src/common/helper')
const busApiClient = helper.getBusApiClient()
const ResourceBooking = models.ResourceBooking
const WorkPeriod = models.WorkPeriod
describe('resourceBooking service test', () => {
  let stubPostEvent
  let stubCreateWorkPeriodService
  let stubUpdateWorkPeriodService
  let stubDeleteWorkPeriodService
  beforeEach(() => {
    stubPostEvent = sinon.stub(busApiClient, 'postEvent').callsFake(async () => undefined)
    stubCreateWorkPeriodService = sinon.stub(workPeriodService, 'createWorkPeriod').callsFake(async () => undefined)
    stubUpdateWorkPeriodService = sinon.stub(workPeriodService, 'partiallyUpdateWorkPeriod').callsFake(async () => undefined)
    stubDeleteWorkPeriodService = sinon.stub(workPeriodService, 'deleteWorkPeriod').callsFake(async () => undefined)
  })

  afterEach(() => {
    sinon.restore()
  })

  describe('Create resource booking successfully', () => {
    let stubEnsureJobById
    let stubEnsureUserById
    beforeEach(() => {
      stubEnsureJobById = sinon.stub(helper, 'ensureJobById').callsFake(async () => undefined)
      stubEnsureUserById = sinon.stub(helper, 'ensureUserById').callsFake(async () => commonData.UserTCConnCopilot)
    })
    it('T01:Create resource booking start Saturday end Sunday', async () => {
      const data = testData.T01
      const stubDBCreate = sinon.stub(ResourceBooking, 'create').callsFake(() => {
        return data.resourceBooking.response
      })
      const entity = await service.createResourceBooking(commonData.currentUser, data.resourceBooking.request)
      expect(entity).to.deep.eql(data.resourceBooking.response.toJSON())
      expect(stubEnsureJobById.calledOnce).to.be.true
      expect(stubEnsureUserById.calledOnce).to.be.true
      expect(stubDBCreate.calledOnce).to.be.true
      expect(stubPostEvent.calledOnce).to.be.true
      expect(stubCreateWorkPeriodService.callCount).to.eq(6)
      expect(stubUpdateWorkPeriodService.callCount).to.eq(0)
      expect(stubDeleteWorkPeriodService.callCount).to.eq(0)
      expect(stubCreateWorkPeriodService.getCall(0).args[1]).to.deep.eq(data.workPeriod.request[0])
      expect(stubCreateWorkPeriodService.getCall(1).args[1]).to.deep.eq(data.workPeriod.request[1])
      expect(stubCreateWorkPeriodService.getCall(2).args[1]).to.deep.eq(data.workPeriod.request[2])
      expect(stubCreateWorkPeriodService.getCall(3).args[1]).to.deep.eq(data.workPeriod.request[3])
      expect(stubCreateWorkPeriodService.getCall(4).args[1]).to.deep.eq(data.workPeriod.request[4])
    })
    it('T02:Create resource booking start Sunday end Saturday', async () => {
      const data = testData.T02
      const stubDBCreate = sinon.stub(ResourceBooking, 'create').callsFake(async () => {
        return data.resourceBooking.response
      })
      const entity = await service.createResourceBooking(commonData.currentUser, data.resourceBooking.request)
      expect(entity).to.deep.eql(data.resourceBooking.response.toJSON())
      expect(stubEnsureJobById.calledOnce).to.be.true
      expect(stubEnsureUserById.calledOnce).to.be.true
      expect(stubDBCreate.calledOnce).to.be.true
      expect(stubPostEvent.calledOnce).to.be.true
      expect(stubCreateWorkPeriodService.callCount).to.eq(1)
      expect(stubUpdateWorkPeriodService.callCount).to.eq(0)
      expect(stubDeleteWorkPeriodService.callCount).to.eq(0)
      expect(stubCreateWorkPeriodService.getCall(0).args[1]).to.deep.eq(data.workPeriod.request[0])
    })
    it('T03:Create resource booking without startDate', async () => {
      const data = testData.T03
      const stubDBCreate = sinon.stub(ResourceBooking, 'create').callsFake(async () => {
        return data.resourceBooking.response
      })
      const entity = await service.createResourceBooking(commonData.currentUser, data.resourceBooking.request)
      expect(entity).to.deep.eql(data.resourceBooking.response.toJSON())
      expect(stubEnsureJobById.calledOnce).to.be.true
      expect(stubEnsureUserById.calledOnce).to.be.true
      expect(stubDBCreate.calledOnce).to.be.true
      expect(stubPostEvent.calledOnce).to.be.true
      expect(stubCreateWorkPeriodService.callCount).to.eq(0)
      expect(stubUpdateWorkPeriodService.callCount).to.eq(0)
      expect(stubDeleteWorkPeriodService.callCount).to.eq(0)
    })
    it('T04:Create resource booking without endDate', async () => {
      const data = testData.T04
      const stubDBCreate = sinon.stub(ResourceBooking, 'create').callsFake(async () => {
        return data.resourceBooking.response
      })
      const entity = await service.createResourceBooking(commonData.currentUser, data.resourceBooking.request)
      expect(entity).to.deep.eql(data.resourceBooking.response.toJSON())
      expect(stubEnsureJobById.calledOnce).to.be.true
      expect(stubEnsureUserById.calledOnce).to.be.true
      expect(stubDBCreate.calledOnce).to.be.true
      expect(stubPostEvent.calledOnce).to.be.true
      expect(stubCreateWorkPeriodService.callCount).to.eq(0)
      expect(stubUpdateWorkPeriodService.callCount).to.eq(0)
      expect(stubDeleteWorkPeriodService.callCount).to.eq(0)
    })
  })
  describe('Create resource booking unsuccessfully', () => {
    let stubEnsureJobById
    let stubEnsureUserById
    beforeEach(() => {
      stubEnsureJobById = sinon.stub(helper, 'ensureJobById').callsFake(async () => undefined)
      stubEnsureUserById = sinon.stub(helper, 'ensureUserById').callsFake(async () => commonData.UserTCConnCopilot)
    })
    it('T05:Fail to create resource booking with startDate greater then endDate', async () => {
      const data = testData.T05
      const stubDBCreate = sinon.stub(ResourceBooking, 'create').callsFake(() => {
        return data.resourceBooking.response
      })
      let error
      try {
        await service.createResourceBooking(commonData.currentUser, data.resourceBooking.request)
      } catch (err) {
        error = err
      }
      expect(error.message).to.eq(data.error.message)
      expect(stubEnsureJobById.notCalled).to.be.true
      expect(stubEnsureUserById.notCalled).to.be.true
      expect(stubDBCreate.notCalled).to.be.true
      expect(stubPostEvent.notCalled).to.be.true
      expect(stubCreateWorkPeriodService.callCount).to.eq(0)
      expect(stubUpdateWorkPeriodService.callCount).to.eq(0)
      expect(stubDeleteWorkPeriodService.callCount).to.eq(0)
    })
  })
  describe('Update resource booking successfully', () => {
    it('T06:Update resource booking dates and do not cause work period change', async () => {
      const data = testData.T06
      const stubResourceBookingFindById = sinon.stub(ResourceBooking, 'findById').callsFake(async () => {
        return data.resourceBooking.value
      })
      const stubWorkPeriodFindAll = sinon.stub(WorkPeriod, 'findAll').callsFake(async () => {
        return data.workPeriod.response
      })
      const entity = await service.partiallyUpdateResourceBooking(commonData.currentUser, data.resourceBooking.value.dataValues.id, data.resourceBooking.request)
      expect(entity).to.deep.eql(data.resourceBooking.response.toJSON())
      expect(stubResourceBookingFindById.calledOnce).to.be.true
      expect(stubPostEvent.calledOnce).to.be.true
      expect(stubWorkPeriodFindAll.called).to.be.true
      expect(stubCreateWorkPeriodService.callCount).to.eq(0)
      expect(stubUpdateWorkPeriodService.callCount).to.eq(0)
      expect(stubDeleteWorkPeriodService.callCount).to.eq(0)
    })
    it('T07:Update resource booking dates and cause work period creation - 1', async () => {
      const data = testData.T07
      const stubResourceBookingFindById = sinon.stub(ResourceBooking, 'findById').callsFake(async () => {
        return data.resourceBooking.value
      })
      const stubWorkPeriodFindAll = sinon.stub(WorkPeriod, 'findAll').callsFake(async () => {
        return data.workPeriod.response
      })
      const entity = await service.partiallyUpdateResourceBooking(commonData.currentUser, data.resourceBooking.value.dataValues.id, data.resourceBooking.request)
      expect(entity).to.deep.eql(data.resourceBooking.response.toJSON())
      expect(stubResourceBookingFindById.calledOnce).to.be.true
      expect(stubPostEvent.calledOnce).to.be.true
      expect(stubWorkPeriodFindAll.called).to.be.true
      expect(stubCreateWorkPeriodService.callCount).to.eq(1)
      expect(stubUpdateWorkPeriodService.callCount).to.eq(0)
      expect(stubDeleteWorkPeriodService.callCount).to.eq(0)
      expect(stubCreateWorkPeriodService.getCall(0).args[1]).to.deep.eq(data.workPeriod.request[0])
    })
    it('T08:Update resource booking dates and cause work period creation - 2', async () => {
      const data = testData.T08
      const stubResourceBookingFindById = sinon.stub(ResourceBooking, 'findById').callsFake(async () => {
        return data.resourceBooking.value
      })
      const stubWorkPeriodFindAll = sinon.stub(WorkPeriod, 'findAll').callsFake(async () => {
        return data.workPeriod.response
      })
      const entity = await service.partiallyUpdateResourceBooking(commonData.currentUser, data.resourceBooking.value.dataValues.id, data.resourceBooking.request)
      expect(entity).to.deep.eql(data.resourceBooking.response.toJSON())
      expect(stubResourceBookingFindById.calledOnce).to.be.true
      expect(stubPostEvent.calledOnce).to.be.true
      expect(stubWorkPeriodFindAll.called).to.be.true
      expect(stubCreateWorkPeriodService.callCount).to.eq(1)
      expect(stubUpdateWorkPeriodService.callCount).to.eq(0)
      expect(stubDeleteWorkPeriodService.callCount).to.eq(0)
      expect(stubCreateWorkPeriodService.getCall(0).args[1]).to.deep.eq(data.workPeriod.request[0])
    })
    it('T09:Update resource booking startDate and cause work period to be deleted', async () => {
      const data = testData.T09
      const stubResourceBookingFindById = sinon.stub(ResourceBooking, 'findById').callsFake(async () => {
        return data.resourceBooking.value
      })
      const stubWorkPeriodFindAll = sinon.stub(WorkPeriod, 'findAll').callsFake(async () => {
        return data.workPeriod.response
      })
      const entity = await service.partiallyUpdateResourceBooking(commonData.currentUser, data.resourceBooking.value.dataValues.id, data.resourceBooking.request)
      expect(entity).to.deep.eql(data.resourceBooking.response.toJSON())
      expect(stubResourceBookingFindById.calledOnce).to.be.true
      expect(stubPostEvent.calledOnce).to.be.true
      expect(stubWorkPeriodFindAll.called).to.be.true
      expect(stubCreateWorkPeriodService.callCount).to.eq(0)
      expect(stubUpdateWorkPeriodService.callCount).to.eq(0)
      expect(stubDeleteWorkPeriodService.callCount).to.eq(1)
      expect(stubDeleteWorkPeriodService.getCall(0).args[1]).to.deep.eq(data.workPeriod.request[0])
    })
    it('T10:Update resource booking endDate and cause work period to be deleted', async () => {
      const data = testData.T10
      const stubResourceBookingFindById = sinon.stub(ResourceBooking, 'findById').callsFake(async () => {
        return data.resourceBooking.value
      })
      const stubWorkPeriodFindAll = sinon.stub(WorkPeriod, 'findAll').callsFake(async () => {
        return data.workPeriod.response
      })
      const entity = await service.partiallyUpdateResourceBooking(commonData.currentUser, data.resourceBooking.value.dataValues.id, data.resourceBooking.request)
      expect(entity).to.deep.eql(data.resourceBooking.response.toJSON())
      expect(stubResourceBookingFindById.calledOnce).to.be.true
      expect(stubPostEvent.calledOnce).to.be.true
      expect(stubWorkPeriodFindAll.called).to.be.true
      expect(stubCreateWorkPeriodService.callCount).to.eq(0)
      expect(stubUpdateWorkPeriodService.callCount).to.eq(0)
      expect(stubDeleteWorkPeriodService.callCount).to.eq(1)
      expect(stubDeleteWorkPeriodService.getCall(0).args[1]).to.deep.eq(data.workPeriod.request[0])
    })
    it('T11:Update resource booking dates and cause work period daysWorked to change', async () => {
      const data = testData.T11
      const stubResourceBookingFindById = sinon.stub(ResourceBooking, 'findById').callsFake(async () => {
        return data.resourceBooking.value
      })
      const stubWorkPeriodFindAll = sinon.stub(WorkPeriod, 'findAll').callsFake(async () => {
        return data.workPeriod.response
      })
      const entity = await service.partiallyUpdateResourceBooking(commonData.currentUser, data.resourceBooking.value.dataValues.id, data.resourceBooking.request)
      expect(entity).to.deep.eql(data.resourceBooking.response.toJSON())
      expect(stubResourceBookingFindById.calledOnce).to.be.true
      expect(stubPostEvent.calledOnce).to.be.true
      expect(stubWorkPeriodFindAll.called).to.be.true
      expect(stubCreateWorkPeriodService.callCount).to.eq(0)
      expect(stubUpdateWorkPeriodService.callCount).to.eq(1)
      expect(stubDeleteWorkPeriodService.callCount).to.eq(0)
      expect(stubUpdateWorkPeriodService.getCall(0).args[1]).to.deep.eq(data.workPeriod.request[0])
      expect(stubUpdateWorkPeriodService.getCall(0).args[2]).to.deep.eq(data.workPeriod.request[1])
    })
    it('T12:Update resource booking dates and cause delete, update, create work period operations', async () => {
      const data = testData.T12
      const stubResourceBookingFindById = sinon.stub(ResourceBooking, 'findById').callsFake(async () => {
        return data.resourceBooking.value
      })
      const stubWorkPeriodFindAll = sinon.stub(WorkPeriod, 'findAll').callsFake(async () => {
        return data.workPeriod.response
      })
      const entity = await service.partiallyUpdateResourceBooking(commonData.currentUser, data.resourceBooking.value.dataValues.id, data.resourceBooking.request)
      expect(entity).to.deep.eql(data.resourceBooking.response.toJSON())
      expect(stubResourceBookingFindById.calledOnce).to.be.true
      expect(stubPostEvent.calledOnce).to.be.true
      expect(stubWorkPeriodFindAll.called).to.be.true
      expect(stubCreateWorkPeriodService.callCount).to.eq(1)
      expect(stubUpdateWorkPeriodService.callCount).to.eq(1)
      expect(stubDeleteWorkPeriodService.callCount).to.eq(1)
      expect(stubDeleteWorkPeriodService.getCall(0).args[1]).to.deep.eq(data.workPeriod.request[0])
      expect(stubUpdateWorkPeriodService.getCall(0).args[1]).to.deep.eq(data.workPeriod.request[1])
      expect(stubUpdateWorkPeriodService.getCall(0).args[2]).to.deep.eq(data.workPeriod.request[2])
      expect(stubCreateWorkPeriodService.getCall(0).args[1]).to.deep.eq(data.workPeriod.request[3])
    })
  })
  describe('Update resource booking unsuccessfully', () => {
    it('T13:Fail to update resource booking status to cancelled', async () => {
      const data = testData.T13
      const stubResourceBookingFindById = sinon.stub(ResourceBooking, 'findById').callsFake(async () => {
        return data.resourceBooking.value
      })
      const stubWorkPeriodFindAll = sinon.stub(WorkPeriod, 'findAll').callsFake(async () => {
        return data.workPeriod.response
      })
      let error
      try {
        await service.partiallyUpdateResourceBooking(commonData.currentUser, data.resourceBooking.value.dataValues.id, data.resourceBooking.request)
      } catch (err) {
        error = err
      }
      expect(error.httpStatus).to.eq(data.error.httpStatus)
      expect(error.message).to.eq(data.error.message)
      expect(stubResourceBookingFindById.calledOnce).to.be.true
      expect(stubPostEvent.notCalled).to.be.true
      expect(stubWorkPeriodFindAll.called).to.be.true
      expect(stubCreateWorkPeriodService.callCount).to.eq(0)
      expect(stubUpdateWorkPeriodService.callCount).to.eq(0)
      expect(stubDeleteWorkPeriodService.callCount).to.eq(0)
    })
    it('T14:Fail to update resource booking dates', async () => {
      const data = testData.T14
      const stubResourceBookingFindById = sinon.stub(ResourceBooking, 'findById').callsFake(async () => {
        return data.resourceBooking.value
      })
      const stubWorkPeriodFindAll = sinon.stub(WorkPeriod, 'findAll').callsFake(async () => {
        return data.workPeriod.response
      })
      let error
      try {
        await service.partiallyUpdateResourceBooking(commonData.currentUser, data.resourceBooking.value.dataValues.id, data.resourceBooking.request)
      } catch (err) {
        error = err
      }
      expect(error.httpStatus).to.eq(data.error.httpStatus)
      expect(error.message).to.eq(data.error.message)
      expect(stubResourceBookingFindById.calledOnce).to.be.true
      expect(stubPostEvent.notCalled).to.be.true
      expect(stubWorkPeriodFindAll.called).to.be.true
      expect(stubCreateWorkPeriodService.callCount).to.eq(0)
      expect(stubUpdateWorkPeriodService.callCount).to.eq(0)
      expect(stubDeleteWorkPeriodService.callCount).to.eq(0)
    })
  })
  describe('Delete resource booking successfully', () => {
    it('T15:Delete resource booking and cause work periods to be deleted ', async () => {
      const data = testData.T15
      const stubResourceBookingFindById = sinon.stub(ResourceBooking, 'findById').callsFake(async () => {
        return data.resourceBooking.value
      })
      const stubWorkPeriodFindAll = sinon.stub(WorkPeriod, 'findAll').callsFake(async () => {
        return data.workPeriod.response
      })
      await service.deleteResourceBooking(commonData.currentUser, data.resourceBooking.value.dataValues.id)
      expect(stubResourceBookingFindById.calledOnce).to.be.true
      expect(stubPostEvent.calledOnce).to.be.true
      expect(stubWorkPeriodFindAll.called).to.be.true
      expect(stubCreateWorkPeriodService.callCount).to.eq(0)
      expect(stubUpdateWorkPeriodService.callCount).to.eq(0)
      expect(stubDeleteWorkPeriodService.callCount).to.eq(2)
      expect(stubDeleteWorkPeriodService.getCall(0).args[1]).to.deep.eq(data.workPeriod.request[0])
      expect(stubDeleteWorkPeriodService.getCall(1).args[1]).to.deep.eq(data.workPeriod.request[1])
    })
  })
  describe('Delete resource booking unsuccessfully', () => {
    it('T16:Fail to delete resource booking with paid work periods', async () => {
      const data = testData.T16
      const stubResourceBookingFindById = sinon.stub(ResourceBooking, 'findById').callsFake(async () => {
        return data.resourceBooking.value
      })
      const stubWorkPeriodFindAll = sinon.stub(WorkPeriod, 'findAll').callsFake(async () => {
        return data.workPeriod.response
      })
      let error
      try {
        await service.deleteResourceBooking(commonData.currentUser, data.resourceBooking.value.dataValues.id)
      } catch (err) {
        error = err
      }
      expect(error.httpStatus).to.eq(data.error.httpStatus)
      expect(error.message).to.eq(data.error.message)
      expect(stubResourceBookingFindById.notCalled).to.be.true
      expect(stubPostEvent.notCalled).to.be.true
      expect(stubWorkPeriodFindAll.called).to.be.true
      expect(stubCreateWorkPeriodService.callCount).to.eq(0)
      expect(stubUpdateWorkPeriodService.callCount).to.eq(0)
      expect(stubDeleteWorkPeriodService.callCount).to.eq(0)
    })
  })
})
