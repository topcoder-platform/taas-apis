/* eslint-disable no-unused-expressions */
process.env.NODE_ENV = 'test'
require('../../src/bootstrap')

const _ = require('lodash')
const expect = require('chai').expect
const sinon = require('sinon')
const models = require('../../src/models')
const service = require('../../src/services/ResourceBookingService')
const {
  bookingManagerUser, connectUser, topCoderUser,
  jobCandidateResponseBody, resourceBookingRequestBody,
  resourceBookingResponseBody, unexpected,
  partiallyUpdateResourceBookingRequestBody, fullyUpdateResourceBookingRequestBody
} = require('./common/testData')

const helper = require('../../src/common/helper')

const esClient = helper.getESClient()
const busApiClient = helper.getBusApiClient()

const ResourceBooking = models.ResourceBooking

describe('resourceBooking service test', () => {
  let isConnectMember
  let userId
  let stubIsConnectMember
  let stubGetUserId
  let stubPostEvent
  beforeEach(() => {
    isConnectMember = true
    stubIsConnectMember = sinon.stub(helper, 'isConnectMember').callsFake(() => {
      return isConnectMember
    })

    userId = 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a'
    stubGetUserId = sinon.stub(helper, 'getUserId').callsFake(() => {
      return userId
    })
    stubPostEvent = sinon.stub(busApiClient, 'postEvent').callsFake(async () => {})
  })

  afterEach(() => {
    sinon.restore()
  })

  describe('create resource booking test', () => {
    it('create resource booking with booking manager success ', async () => {
      const stubDBCreate = sinon.stub(ResourceBooking, 'create').callsFake(() => {
        return resourceBookingResponseBody
      })
      const entity = await service.createResourceBooking(bookingManagerUser, resourceBookingRequestBody)
      expect(entity).to.deep.eql(resourceBookingResponseBody.dataValues)
      expect(stubDBCreate.calledOnce).to.be.true
      expect(stubPostEvent.calledOnce).to.be.true
    })

    it('create resource booking with connect user success ', async () => {
      const stubDBCreate = sinon.stub(ResourceBooking, 'create').callsFake(() => {
        return resourceBookingResponseBody
      })

      const entity = await service.createResourceBooking(connectUser, resourceBookingRequestBody)
      expect(entity).to.deep.eql(resourceBookingResponseBody.dataValues)
      expect(stubDBCreate.calledOnce).to.be.true
      expect(stubPostEvent.calledOnce).to.be.true
      expect(stubIsConnectMember.calledOnce).to.be.true
      expect(stubGetUserId.calledOnce).to.be.true
    })

    it('create resource booking with topcoder user failed ', async () => {
      isConnectMember = false
      try {
        await service.createResourceBooking(topCoderUser, resourceBookingRequestBody)
      } catch (error) {
        expect(error.message).to.equal('You are not allowed to perform this action!')
      }
    })
  })

  describe('get resource booking test', () => {
    it('get resource booking with booking manager success', async () => {
      const resourceBookingRes = _.cloneDeep(resourceBookingResponseBody)
      const stub = sinon.stub(esClient, 'get').callsFake(async () => {
        return {
          body: {
            _id: resourceBookingRes.dataValues.id,
            _source: _.omit(resourceBookingRes.dataValues, ['id'])
          }
        }
      })
      const entity = await service.getResourceBooking(bookingManagerUser, resourceBookingResponseBody.dataValues.id)
      expect(entity).to.deep.eql(resourceBookingRes.dataValues)
      expect(stub.calledOnce).to.be.true
    })

    it('get resource booking with connect user success', async () => {
      const resourceBookingRes = _.cloneDeep(resourceBookingResponseBody)
      const stub = sinon.stub(esClient, 'get').callsFake(async () => {
        return {
          body: {
            _id: resourceBookingRes.dataValues.id,
            _source: _.omit(resourceBookingRes.dataValues, ['id'])
          }
        }
      })

      const entity = await service.getResourceBooking(connectUser, resourceBookingResponseBody.dataValues.id)
      expect(entity).to.deep.eql(_.omit(resourceBookingRes.dataValues, ['memberRate']))
      expect(stub.calledOnce).to.be.true
      expect(stubIsConnectMember.calledOnce).to.be.true
    })

    it('get resource booking with topcoder user success', async () => {
      isConnectMember = false
      const resourceBookingRes = _.cloneDeep(resourceBookingResponseBody)
      const stub = sinon.stub(esClient, 'get').callsFake(async () => {
        return {
          body: {
            _id: resourceBookingRes.dataValues.id,
            _source: _.omit(resourceBookingRes.dataValues, ['id'])
          }
        }
      })
      const entity = await service.getResourceBooking(topCoderUser, resourceBookingResponseBody.dataValues.id)
      expect(entity).to.deep.eql(_.omit(resourceBookingRes.dataValues, ['customerRate']))
      expect(stub.calledOnce).to.be.true
    })

    it('get resource booking with resource booking not exist success', async () => {
      const stub = sinon.stub(esClient, 'get').callsFake(async () => {
        const err = new Error()
        err.statusCode = 404
        throw err
      })
      try {
        await service.getResourceBooking(bookingManagerUser, resourceBookingResponseBody.dataValues.id)
      } catch (error) {
        expect(error.message).to.equal(`id: ${resourceBookingResponseBody.dataValues.id} "ResourceBooking" not found`)
        expect(stub.calledOnce).to.be.true
      }
    })

    it('get resource booking from db with booking manager success', async () => {
      const resourceBookingRes = _.cloneDeep(resourceBookingResponseBody)
      const stub = sinon.stub(ResourceBooking, 'findOne').callsFake(() => {
        return resourceBookingRes
      })
      const entity = await service.getResourceBooking(bookingManagerUser, resourceBookingResponseBody.dataValues.id, true)
      expect(entity).to.deep.eql(resourceBookingRes.dataValues)
      expect(stub.calledOnce).to.be.true
    })

    it('get resource booking from db with connect user success', async () => {
      const resourceBookingRes = _.cloneDeep(resourceBookingResponseBody)
      const stub = sinon.stub(ResourceBooking, 'findOne').callsFake(() => {
        return resourceBookingRes
      })

      const entity = await service.getResourceBooking(connectUser, resourceBookingResponseBody.dataValues.id, true)
      expect(entity).to.deep.eql(_.omit(resourceBookingRes.dataValues, ['memberRate']))
      expect(stub.calledOnce).to.be.true
      expect(stubIsConnectMember.calledOnce).to.be.true
    })

    it('get resource booking from db with topcoder user success', async () => {
      isConnectMember = false
      const resourceBookingRes = _.cloneDeep(resourceBookingResponseBody)
      const stub = sinon.stub(ResourceBooking, 'findOne').callsFake(() => {
        return resourceBookingRes
      })
      const entity = await service.getResourceBooking(topCoderUser, resourceBookingResponseBody.dataValues.id, true)
      expect(entity).to.deep.eql(_.omit(resourceBookingRes.dataValues, ['customerRate']))
      expect(stub.calledOnce).to.be.true
    })

    it('get resource booking from db with resource booking not exist success', async () => {
      const stub = sinon.stub(ResourceBooking, 'findOne').callsFake(() => {
        return null
      })
      try {
        await service.getResourceBooking(bookingManagerUser, resourceBookingResponseBody.dataValues.id, true)
      } catch (error) {
        expect(error.message).to.equal(`id: ${resourceBookingResponseBody.dataValues.id} "ResourceBooking" doesn't exists.`)
        expect(stub.calledOnce).to.be.true
      }
    })
  })

  describe('fully update resource booking test', () => {
    it('fully update resource booking test with booking manager success', async () => {
      const resourceBookingRes = _.cloneDeep(resourceBookingResponseBody)
      const stubResourceBookingFindOne = sinon.stub(ResourceBooking, 'findOne').callsFake(() => {
        return {
          ...resourceBookingRes,
          update: () => { return null }
        }
      })
      const entity = await service.fullyUpdateResourceBooking(bookingManagerUser, resourceBookingResponseBody.dataValues.id, fullyUpdateResourceBookingRequestBody)
      expect(entity).to.deep.eql(resourceBookingRes.dataValues)
      expect(stubResourceBookingFindOne.calledOnce).to.be.true
      expect(stubPostEvent.calledOnce).to.be.true
    })

    it('fully update resource booking test with connect user success', async () => {
      const resourceBookingRes = _.cloneDeep(resourceBookingResponseBody)
      const stubResourceBookingFindOne = sinon.stub(ResourceBooking, 'findOne').callsFake(() => {
        return {
          ...resourceBookingRes,
          update: () => { return null }
        }
      })

      const entity = await service.fullyUpdateResourceBooking(connectUser, resourceBookingResponseBody.dataValues.id, fullyUpdateResourceBookingRequestBody)
      expect(entity).to.deep.eql(resourceBookingRes.dataValues)
      expect(stubResourceBookingFindOne.calledOnce).to.be.true
      expect(stubPostEvent.calledOnce).to.be.true
      expect(stubIsConnectMember.calledOnce).to.be.true
    })

    it('fully update resource booking test with topcoder user failed', async () => {
      isConnectMember = false
      const resourceBookingRes = _.cloneDeep(resourceBookingResponseBody)
      const stubResourceBookingFindOne = sinon.stub(ResourceBooking, 'findOne').callsFake(() => {
        return {
          ...resourceBookingRes,
          update: () => { return null }
        }
      })
      try {
        await service.fullyUpdateResourceBooking(topCoderUser, resourceBookingResponseBody.dataValues.id, fullyUpdateResourceBookingRequestBody)
        unexpected()
      } catch (error) {
        expect(stubResourceBookingFindOne.calledOnce).to.be.true
        expect(error.message).to.equal('You are not allowed to perform this action!')
      }
    })
  })

  describe('partially update resource booking test', () => {
    it('partially update resource booking test with booking manager success', async () => {
      const resourceBookingRes = _.cloneDeep(resourceBookingResponseBody)
      const stubResourceBookingFindOne = sinon.stub(ResourceBooking, 'findOne').callsFake(() => {
        return {
          ...resourceBookingRes,
          update: () => { return null }
        }
      })
      const entity = await service.partiallyUpdateResourceBooking(bookingManagerUser, resourceBookingResponseBody.dataValues.id, partiallyUpdateResourceBookingRequestBody)
      expect(entity).to.deep.eql(resourceBookingRes.dataValues)
      expect(stubResourceBookingFindOne.calledOnce).to.be.true
      expect(stubPostEvent.calledOnce).to.be.true
    })

    it('partially update resource booking test with connect user success', async () => {
      const resourceBookingRes = _.cloneDeep(resourceBookingResponseBody)
      const stubResourceBookingFindOne = sinon.stub(ResourceBooking, 'findOne').callsFake(() => {
        return {
          ...resourceBookingRes,
          update: () => { return null }
        }
      })

      const entity = await service.partiallyUpdateResourceBooking(connectUser, resourceBookingResponseBody.dataValues.id, partiallyUpdateResourceBookingRequestBody)
      expect(entity).to.deep.eql(resourceBookingRes.dataValues)
      expect(stubResourceBookingFindOne.calledOnce).to.be.true
      expect(stubPostEvent.calledOnce).to.be.true
      expect(stubIsConnectMember.calledOnce).to.be.true
    })

    it('partially update resource booking test with topcoder user failed', async () => {
      isConnectMember = false
      const resourceBookingRes = _.cloneDeep(resourceBookingResponseBody)
      const stubResourceBookingFindOne = sinon.stub(ResourceBooking, 'findOne').callsFake(() => {
        return {
          ...resourceBookingRes,
          update: () => { return null }
        }
      })
      try {
        await service.partiallyUpdateResourceBooking(topCoderUser, resourceBookingResponseBody.dataValues.id, partiallyUpdateResourceBookingRequestBody)
        unexpected()
      } catch (error) {
        expect(error.message).to.equal('You are not allowed to perform this action!')
      }
      expect(stubResourceBookingFindOne.calledOnce).to.be.true
    })
  })

  describe('delete resource booking test', () => {
    it('delete resource booking test with booking manager success', async () => {
      const stubResourceBookingFindOne = sinon.stub(ResourceBooking, 'findOne').callsFake(() => {
        return {
          ..._.cloneDeep(resourceBookingResponseBody),
          update: () => { return null }
        }
      })
      await service.deleteResourceBooking(bookingManagerUser, resourceBookingResponseBody.dataValues.id)
      expect(stubResourceBookingFindOne.calledOnce).to.be.true
      expect(stubPostEvent.calledOnce).to.be.true
    })

    it('delete resource booking test with connect user failed', async () => {
      try {
        await service.deleteResourceBooking(connectUser, resourceBookingResponseBody.dataValues.id)
        unexpected()
      } catch (error) {
        expect(error.message).to.equal('You are not allowed to perform this action!')
      }
    })

    it('delete resource booking test with topcoder user failed', async () => {
      try {
        await service.deleteResourceBooking(topCoderUser, jobCandidateResponseBody.dataValues.id)
        unexpected()
      } catch (error) {
        expect(error.message).to.equal('You are not allowed to perform this action!')
      }
    })
  })

  describe('search resource booking test', () => {
    it('search resource booking success', async () => {
      const stub = sinon.stub(esClient, 'search').callsFake(() => {
        return {
          body: {
            hits: {
              total: {
                value: 1
              },
              hits: [{
                _id: resourceBookingResponseBody.dataValues.id,
                _source: _.omit(resourceBookingResponseBody.dataValues, ['id'])
              }]
            }
          }
        }
      })
      const entity = await service.searchResourceBookings({ sortBy: 'id', sortOrder: 'asc', page: 1, perPage: 1, status: 'sourcing' })
      expect(entity.result[0]).to.deep.eql(resourceBookingResponseBody.dataValues)
      expect(stub.calledOnce).to.be.true
    })

    it('search resource booking without query parameters success', async () => {
      const stub = sinon.stub(esClient, 'search').callsFake(() => {
        return {
          body: {
            hits: {
              total: {
                value: 1
              },
              hits: [{
                _id: resourceBookingResponseBody.dataValues.id,
                _source: _.omit(resourceBookingResponseBody.dataValues, ['id'])
              }]
            }
          }
        }
      })
      const entity = await service.searchResourceBookings({})
      expect(entity.result[0]).to.deep.eql(resourceBookingResponseBody.dataValues)
      expect(stub.calledOnce).to.be.true
    })

    it('search resource booking success when es search fails', async () => {
      const stubESSearch = sinon.stub(esClient, 'search').callsFake(() => {
        throw new Error('dedicated es failure')
      })

      const stubDBSearch = sinon.stub(ResourceBooking, 'findAll').callsFake(() => {
        return [resourceBookingResponseBody]
      })
      const entity = await service.searchResourceBookings({ sortBy: 'id', sortOrder: 'asc', page: 1, perPage: 1, status: 'sourcing' })
      expect(entity.result[0]).to.deep.eql(resourceBookingResponseBody.dataValues)
      expect(stubESSearch.calledOnce).to.be.true
      expect(stubDBSearch.calledOnce).to.be.true
    })
  })
})
