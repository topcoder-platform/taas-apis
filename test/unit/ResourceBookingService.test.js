/* eslint-disable no-unused-expressions */

const expect = require('chai').expect
const sinon = require('sinon')
const models = require('../../src/models')
const service = require('../../src/services/ResourceBookingService')
const workPeriodService = require('../../src/services/WorkPeriodService')
const commonData = require('./common/CommonData')
const testData = require('./common/ResourceBookingData')
const helper = require('../../src/common/helper')
const errors = require('../../src/common/errors')
const _ = require('lodash')
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
      stubEnsureUserById = sinon.stub(helper, 'ensureTopcoderUserIdExists').callsFake(async () => commonData.UsrTCConnCopilot)
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
      expect(stubCreateWorkPeriodService.getCall(0).args[0]).to.deep.eq(data.workPeriod.request[0])
      expect(stubCreateWorkPeriodService.getCall(1).args[0]).to.deep.eq(data.workPeriod.request[1])
      expect(stubCreateWorkPeriodService.getCall(2).args[0]).to.deep.eq(data.workPeriod.request[2])
      expect(stubCreateWorkPeriodService.getCall(3).args[0]).to.deep.eq(data.workPeriod.request[3])
      expect(stubCreateWorkPeriodService.getCall(4).args[0]).to.deep.eq(data.workPeriod.request[4])
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
      expect(stubCreateWorkPeriodService.getCall(0).args[0]).to.deep.eq(data.workPeriod.request[0])
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
      stubEnsureUserById = sinon.stub(helper, 'ensureTopcoderUserIdExists').callsFake(async () => commonData.UsrTCConnCopilot)
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
    it('T06:Update resource booking dates and do not cause work period create/delete', async () => {
      const data = testData.T06
      const stubResourceBookingFindById = sinon.stub(ResourceBooking, 'findById').callsFake(async () => {
        return data.resourceBooking.value
      })
      const stubWorkPeriodFindAll = sinon.stub(WorkPeriod, 'findAll').callsFake(async (criteria) => {
        if (criteria.raw) {
          return _.map(data.workPeriod.response, wp => wp.toJSON())
        }
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
      expect(stubUpdateWorkPeriodService.getCall(0).args[1]).to.deep.eq(data.workPeriod.request[0].id)
      expect(stubUpdateWorkPeriodService.getCall(0).args[2]).to.deep.eq(data.workPeriod.request[0].data)
    })
    it('T07:Update resource booking dates and cause work period creation - 1', async () => {
      const data = testData.T07
      const stubResourceBookingFindById = sinon.stub(ResourceBooking, 'findById').callsFake(async () => {
        return data.resourceBooking.value
      })
      const stubWorkPeriodFindAll = sinon.stub(WorkPeriod, 'findAll').callsFake(async (criteria) => {
        if (criteria.raw) {
          return _.map(data.workPeriod.response, wp => wp.toJSON())
        }
        return data.workPeriod.response
      })
      const entity = await service.partiallyUpdateResourceBooking(commonData.currentUser, data.resourceBooking.value.dataValues.id, data.resourceBooking.request)
      expect(entity).to.deep.eql(data.resourceBooking.response.toJSON())
      expect(stubResourceBookingFindById.calledOnce).to.be.true
      expect(stubPostEvent.calledOnce).to.be.true
      expect(stubWorkPeriodFindAll.called).to.be.true
      expect(stubCreateWorkPeriodService.callCount).to.eq(1)
      expect(stubUpdateWorkPeriodService.callCount).to.eq(1)
      expect(stubDeleteWorkPeriodService.callCount).to.eq(0)
      expect(stubCreateWorkPeriodService.getCall(0).args[0]).to.deep.eq(data.workPeriod.request[0].data)
      expect(stubUpdateWorkPeriodService.getCall(0).args[1]).to.deep.eq(data.workPeriod.request[1].id)
      expect(stubUpdateWorkPeriodService.getCall(0).args[2]).to.deep.eq(data.workPeriod.request[1].data)
    })
    it('T08:Update resource booking dates and cause work period creation - 2', async () => {
      const data = testData.T08
      const stubResourceBookingFindById = sinon.stub(ResourceBooking, 'findById').callsFake(async () => {
        return data.resourceBooking.value
      })
      const stubWorkPeriodFindAll = sinon.stub(WorkPeriod, 'findAll').callsFake(async (criteria) => {
        if (criteria.raw) {
          return _.map(data.workPeriod.response, wp => wp.toJSON())
        }
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
      expect(stubCreateWorkPeriodService.getCall(0).args[0]).to.deep.eq(data.workPeriod.request[0].data)
    })
    it('T09:Update resource booking startDate and cause work period to be deleted', async () => {
      const data = testData.T09
      const stubResourceBookingFindById = sinon.stub(ResourceBooking, 'findById').callsFake(async () => {
        return data.resourceBooking.value
      })
      const stubWorkPeriodFindAll = sinon.stub(WorkPeriod, 'findAll').callsFake(async (criteria) => {
        if (criteria.raw) {
          return _.map(data.workPeriod.response, wp => wp.toJSON())
        }
        return data.workPeriod.response
      })
      const entity = await service.partiallyUpdateResourceBooking(commonData.currentUser, data.resourceBooking.value.dataValues.id, data.resourceBooking.request)
      expect(entity).to.deep.eql(data.resourceBooking.response.toJSON())
      expect(stubResourceBookingFindById.calledOnce).to.be.true
      expect(stubPostEvent.calledOnce).to.be.true
      expect(stubWorkPeriodFindAll.called).to.be.true
      expect(stubCreateWorkPeriodService.callCount).to.eq(0)
      expect(stubUpdateWorkPeriodService.callCount).to.eq(1)
      expect(stubDeleteWorkPeriodService.callCount).to.eq(1)
      expect(stubDeleteWorkPeriodService.getCall(0).args[0]).to.deep.eq(data.workPeriod.request[0].id)
      expect(stubUpdateWorkPeriodService.getCall(0).args[1]).to.deep.eq(data.workPeriod.request[1].id)
      expect(stubUpdateWorkPeriodService.getCall(0).args[2]).to.deep.eq(data.workPeriod.request[1].data)
    })
    it('T10:Update resource booking endDate and cause work period to be deleted', async () => {
      const data = testData.T10
      const stubResourceBookingFindById = sinon.stub(ResourceBooking, 'findById').callsFake(async () => {
        return data.resourceBooking.value
      })
      const stubWorkPeriodFindAll = sinon.stub(WorkPeriod, 'findAll').callsFake(async (criteria) => {
        if (criteria.raw) {
          return _.map(data.workPeriod.response, wp => wp.toJSON())
        }
        return data.workPeriod.response
      })
      const entity = await service.partiallyUpdateResourceBooking(commonData.currentUser, data.resourceBooking.value.dataValues.id, data.resourceBooking.request)
      expect(entity).to.deep.eql(data.resourceBooking.response.toJSON())
      expect(stubResourceBookingFindById.calledOnce).to.be.true
      expect(stubPostEvent.calledOnce).to.be.true
      expect(stubWorkPeriodFindAll.called).to.be.true
      expect(stubCreateWorkPeriodService.callCount).to.eq(0)
      expect(stubUpdateWorkPeriodService.callCount).to.eq(1)
      expect(stubDeleteWorkPeriodService.callCount).to.eq(1)
      expect(stubDeleteWorkPeriodService.getCall(0).args[0]).to.deep.eq(data.workPeriod.request[0].id)
      expect(stubUpdateWorkPeriodService.getCall(0).args[1]).to.deep.eq(data.workPeriod.request[1].id)
      expect(stubUpdateWorkPeriodService.getCall(0).args[2]).to.deep.eq(data.workPeriod.request[1].data)
    })
    it('T11:Update resource booking dates and cause work period daysWorked to change', async () => {
      const data = testData.T11
      const stubResourceBookingFindById = sinon.stub(ResourceBooking, 'findById').callsFake(async () => {
        return data.resourceBooking.value
      })
      const stubWorkPeriodFindAll = sinon.stub(WorkPeriod, 'findAll').callsFake(async (criteria) => {
        if (criteria.raw) {
          return _.map(data.workPeriod.response, wp => wp.toJSON())
        }
        return data.workPeriod.response
      })
      const entity = await service.partiallyUpdateResourceBooking(commonData.currentUser, data.resourceBooking.value.dataValues.id, data.resourceBooking.request)
      expect(entity).to.deep.eql(data.resourceBooking.response.toJSON())
      expect(stubResourceBookingFindById.calledOnce).to.be.true
      expect(stubPostEvent.calledOnce).to.be.true
      expect(stubWorkPeriodFindAll.called).to.be.true
      expect(stubCreateWorkPeriodService.callCount).to.eq(0)
      expect(stubUpdateWorkPeriodService.callCount).to.eq(2)
      expect(stubDeleteWorkPeriodService.callCount).to.eq(0)
      expect(stubUpdateWorkPeriodService.getCall(0).args[1]).to.deep.eq(data.workPeriod.request[0].id)
      expect(stubUpdateWorkPeriodService.getCall(0).args[2]).to.deep.eq(data.workPeriod.request[0].data)
      expect(stubUpdateWorkPeriodService.getCall(1).args[1]).to.deep.eq(data.workPeriod.request[1].id)
      expect(stubUpdateWorkPeriodService.getCall(1).args[2]).to.deep.eq(data.workPeriod.request[1].data)
    })
    it('T12:Update resource booking dates and cause delete, update, create work period operations', async () => {
      const data = testData.T12
      const stubResourceBookingFindById = sinon.stub(ResourceBooking, 'findById').callsFake(async () => {
        return data.resourceBooking.value
      })
      const stubWorkPeriodFindAll = sinon.stub(WorkPeriod, 'findAll').callsFake(async (criteria) => {
        if (criteria.raw) {
          return _.map(data.workPeriod.response, wp => wp.toJSON())
        }
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
      expect(stubDeleteWorkPeriodService.getCall(0).args[0]).to.deep.eq(data.workPeriod.request[0].id)
      expect(stubUpdateWorkPeriodService.getCall(0).args[1]).to.deep.eq(data.workPeriod.request[1].id)
      expect(stubUpdateWorkPeriodService.getCall(0).args[2]).to.deep.eq(data.workPeriod.request[1].data)
      expect(stubCreateWorkPeriodService.getCall(0).args[0]).to.deep.eq(data.workPeriod.request[2].data)
    })
  })
  describe('Update resource booking unsuccessfully', () => {
    it('T13:Fail to update resource booking status to cancelled', async () => {
      const data = testData.T13
      const stubResourceBookingFindById = sinon.stub(ResourceBooking, 'findById').callsFake(async () => {
        return data.resourceBooking.value
      })
      const stubWorkPeriodFindAll = sinon.stub(WorkPeriod, 'findAll').callsFake(async (criteria) => {
        if (criteria.raw) {
          return _.map(data.workPeriod.response, wp => wp.toJSON())
        }
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
      const stubWorkPeriodFindAll = sinon.stub(WorkPeriod, 'findAll').callsFake(async (criteria) => {
        if (criteria.raw) {
          return _.map(data.workPeriod.response, wp => wp.toJSON())
        }
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
      const stubWorkPeriodFindAll = sinon.stub(WorkPeriod, 'findAll').callsFake(async (criteria) => {
        if (criteria.raw) {
          return _.map(data.workPeriod.response, wp => wp.toJSON())
        }
        return data.workPeriod.response
      })
      await service.deleteResourceBooking(commonData.currentUser, data.resourceBooking.value.dataValues.id)
      expect(stubResourceBookingFindById.calledOnce).to.be.true
      expect(stubPostEvent.calledOnce).to.be.true
      expect(stubWorkPeriodFindAll.called).to.be.true
      expect(stubCreateWorkPeriodService.callCount).to.eq(0)
      expect(stubUpdateWorkPeriodService.callCount).to.eq(0)
      expect(stubDeleteWorkPeriodService.callCount).to.eq(2)
      expect(stubDeleteWorkPeriodService.getCall(0).args[0]).to.deep.eq(data.workPeriod.request[0].id)
      expect(stubDeleteWorkPeriodService.getCall(1).args[0]).to.deep.eq(data.workPeriod.request[1].id)
    })
  })
  describe('Delete resource booking unsuccessfully', () => {
    it('T16:Fail to delete resource booking with paid work periods', async () => {
      const data = testData.T16
      const stubResourceBookingFindById = sinon.stub(ResourceBooking, 'findById').callsFake(async () => {
        return data.resourceBooking.value
      })
      const stubWorkPeriodFindAll = sinon.stub(WorkPeriod, 'findAll').callsFake(async (criteria) => {
        if (criteria.raw) {
          return _.map(data.workPeriod.response, wp => wp.toJSON())
        }
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
  describe('Get resource booking with/without nested fields', () => {
    it('T17:Get resource booking from ES', async () => {
      const data = testData.T17
      const ESClient = commonData.ESClient
      ESClient.get = () => {}
      const esClientGet = sinon.stub(ESClient, 'get').callsFake(() => data.esClientGet)
      const result = await service.getResourceBooking(commonData.userWithManagePermission, data.esClientGet.body._source.id, data.criteria)
      expect(esClientGet.calledOnce).to.be.true
      expect(result).to.deep.eq(data.esClientGet.body._source)
    })
    it('T18:Get resource booking from DB', async () => {
      const data = testData.T18
      const stubResourceBookingFindById = sinon.stub(ResourceBooking, 'findById').callsFake(async () => {
        return data.resourceBooking.value
      })
      const result = await service.getResourceBooking(commonData.userWithManagePermission, data.resourceBooking.value.dataValues.id, data.criteria)
      expect(stubResourceBookingFindById.calledOnce).to.be.true
      expect(result).to.deep.eq(data.resourceBooking.value.dataValues)
    })
    it('T19:Fail to get resource booking with not allowed fields', async () => {
      const data = testData.T19
      let error
      try {
        await service.getResourceBooking(commonData.userWithManagePermission, data.id, data.criteria)
      } catch (err) {
        error = err
      }
      expect(error.httpStatus).to.eq(data.error.httpStatus)
      expect(error.message).to.eq(data.error.message)
    })
    it('T20:Fail to get resource booking with memberRate', async () => {
      const data = testData.T20
      let error
      try {
        await service.getResourceBooking(commonData.regularUser, data.id, data.criteria)
      } catch (err) {
        error = err
      }
      expect(error.httpStatus).to.eq(data.error.httpStatus)
      expect(error.message).to.eq(data.error.message)
    })
    it('T21:Fail to get resource booking with nested workPeriods', async () => {
      const data = testData.T21
      let error
      try {
        await service.getResourceBooking(commonData.currentUser, data.id, data.criteria)
      } catch (err) {
        error = err
      }
      expect(error.httpStatus).to.eq(data.error.httpStatus)
      expect(error.message).to.eq(data.error.message)
    })
    it('T22:Fail to get resource booking without including projectId as a regularUser', async () => {
      const data = testData.T22
      let error
      try {
        await service.getResourceBooking(commonData.regularUser, data.id, data.criteria)
      } catch (err) {
        error = err
      }
      expect(error.httpStatus).to.eq(data.error.httpStatus)
      expect(error.message).to.eq(data.error.message)
    })
    it('T23:Fail to get resource booking as a regularUser who is not member of project', async () => {
      const data = testData.T23
      const ESClient = commonData.ESClient
      ESClient.get = () => {}
      const esClientGet = sinon.stub(ESClient, 'get').callsFake(() => data.esClientGet)
      const checkIsMemberOfProject = sinon.stub(helper, 'checkIsMemberOfProject').callsFake(() => {
        throw new errors.UnauthorizedError(data.error.message)
      })
      let error
      try {
        await service.getResourceBooking(commonData.regularUser, data.id, data.criteria)
      } catch (err) {
        error = err
      }
      expect(esClientGet.calledOnce).to.be.true
      expect(checkIsMemberOfProject.calledOnce).to.be.true
      expect(error.httpStatus).to.eq(data.error.httpStatus)
      expect(error.message).to.eq(data.error.message)
    })
  })
  describe('Search resource booking with/without nested fields', () => {
    it('T24:Search resource booking from ES', async () => {
      const data = testData.T24
      const ESClient = commonData.ESClient
      ESClient.search = () => {}
      const esClientSearch = sinon.stub(ESClient, 'search').callsFake(() => data.esClientSearch)
      const result = await service.searchResourceBookings(commonData.userWithManagePermission, data.criteria)
      expect(esClientSearch.calledOnce).to.be.true
      expect(result).to.deep.eq(data.result)
    })
    it('T25:Search resource booking from DB', async () => {
      const data = testData.T25
      const ESClient = commonData.ESClient
      ESClient.search = () => {}
      const esClientSearch = sinon.stub(ESClient, 'search').callsFake(() => { throw new Error() })
      const stubResourceBookingFindAll = sinon.stub(ResourceBooking, 'findAll').callsFake(async () => {
        return data.resourceBookingFindAll
      })
      const stubResourceBookingCount = sinon.stub(ResourceBooking, 'count').callsFake(async () => {
        return data.resourceBookingCount
      })
      const result = await service.searchResourceBookings(commonData.userWithManagePermission, data.criteria)
      expect(esClientSearch.calledOnce).to.be.true
      expect(stubResourceBookingFindAll.calledOnce).to.be.true
      expect(stubResourceBookingCount.calledOnce).to.be.true
      expect(result).to.deep.eq(data.result)
    })
    it('T26:Fail to search resource booking with not allowed fields', async () => {
      const data = testData.T26
      let error
      try {
        await service.searchResourceBookings(commonData.userWithManagePermission, data.criteria)
      } catch (err) {
        error = err
      }
      expect(error.httpStatus).to.eq(data.error.httpStatus)
      expect(error.message).to.eq(data.error.message)
    })
    it('T27:Fail to search resource booking with memberRate', async () => {
      const data = testData.T27
      let error
      try {
        await service.searchResourceBookings(commonData.regularUser, data.criteria)
      } catch (err) {
        error = err
      }
      expect(error.httpStatus).to.eq(data.error.httpStatus)
      expect(error.message).to.eq(data.error.message)
    })
    it('T28:Fail to search resource booking with nested workPeriods', async () => {
      const data = testData.T28
      let error
      try {
        await service.searchResourceBookings(commonData.currentUser, data.criteria)
      } catch (err) {
        error = err
      }
      expect(error.httpStatus).to.eq(data.error.httpStatus)
      expect(error.message).to.eq(data.error.message)
    })
    it('T29:Fail to search resource booking without filtering by projectId as a regularUser', async () => {
      const data = testData.T29
      let error
      try {
        await service.searchResourceBookings(commonData.regularUser, data.criteria)
      } catch (err) {
        error = err
      }
      expect(error.httpStatus).to.eq(data.error.httpStatus)
      expect(error.message).to.eq(data.error.message)
    })
    it('T30:Fail to search resource booking as a regularUser who is not member of project', async () => {
      const data = testData.T30
      const checkIsMemberOfProject = sinon.stub(helper, 'checkIsMemberOfProject').callsFake(() => {
        throw new errors.UnauthorizedError(data.error.message)
      })
      let error
      try {
        await service.searchResourceBookings(commonData.regularUser, data.criteria)
      } catch (err) {
        error = err
      }
      expect(checkIsMemberOfProject.calledOnce).to.be.true
      expect(error.httpStatus).to.eq(data.error.httpStatus)
      expect(error.message).to.eq(data.error.message)
    })
    it('T31:Fail to search resource booking with filtering by nested field', async () => {
      const data = testData.T31
      let error
      try {
        await service.searchResourceBookings(commonData.userWithManagePermission, data.criteria)
      } catch (err) {
        error = err
      }
      expect(error.httpStatus).to.eq(data.error.httpStatus)
      expect(error.message).to.eq(data.error.message)
    })
    it('T32:Fail to search resource booking with sorting by not included field', async () => {
      const data = testData.T32
      let error
      try {
        await service.searchResourceBookings(commonData.userWithManagePermission, data.criteria)
      } catch (err) {
        error = err
      }
      expect(error.httpStatus).to.eq(data.error.httpStatus)
      expect(error.message).to.eq(data.error.message)
    })
    it('T33:Fail to search resource booking with sorting by nested field', async () => {
      const data = testData.T33
      let error
      try {
        await service.searchResourceBookings(commonData.userWithManagePermission, data.criteria)
      } catch (err) {
        error = err
      }
      expect(error.httpStatus).to.eq(data.error.httpStatus)
      expect(error.message).to.eq(data.error.message)
    })
    it('T34:Fail to search resource booking with filtering by not included field', async () => {
      const data = testData.T34
      let error
      try {
        await service.searchResourceBookings(commonData.userWithManagePermission, data.criteria)
      } catch (err) {
        error = err
      }
      expect(error.httpStatus).to.eq(data.error.httpStatus)
      expect(error.message).to.eq(data.error.message)
    })
    it('T35:Fail to search resource booking with filtering by not included nested field', async () => {
      const data = testData.T35
      let error
      try {
        await service.searchResourceBookings(commonData.userWithManagePermission, data.criteria)
      } catch (err) {
        error = err
      }
      expect(error.httpStatus).to.eq(data.error.httpStatus)
      expect(error.message).to.eq(data.error.message)
    })
  })
  describe('Update resource booking dates to null', () => {
    it('T36:Should not allow setting dates to null if both dates are not null', async () => {
      const data = testData.T36
      const stubResourceBookingFindById = sinon.stub(ResourceBooking, 'findById').callsFake(async () => {
        return data.resourceBooking.value
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
      expect(stubCreateWorkPeriodService.callCount).to.eq(0)
      expect(stubUpdateWorkPeriodService.callCount).to.eq(0)
      expect(stubDeleteWorkPeriodService.callCount).to.eq(0)
    })
    it('T37:Should allow setting dates to null if one of the dates is null', async () => {
      const data = testData.T37
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
    it('T38:Should allow setting dates to null if both dates are null', async () => {
      const data = testData.T38
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
  })
})
