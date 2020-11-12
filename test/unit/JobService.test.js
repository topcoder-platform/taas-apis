/* eslint-disable no-unused-expressions */
process.env.NODE_ENV = 'test'
const _ = require('lodash')
require('../../src/bootstrap')

const expect = require('chai').expect
const sinon = require('sinon')
const models = require('../../src/models')
const service = require('../../src/services/JobService')
const {
  bookingManagerUser, connectUser, topCoderUser, jobRequestBody,
  jobResponseBody, fullyUpdateJobRequestBody, partiallyUpdateJobRequestBody, unexpected
} = require('./common/testData')
const helper = require('../../src/common/helper')
const errors = require('../../src/common/errors')

const esClient = helper.getESClient()
const busApiClient = helper.getBusApiClient()

const Job = models.Job

describe('job service test', () => {
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

  describe('create job test', () => {
    it('create job with booking manager user success ', async () => {
      const stubDBCreate = sinon.stub(Job, 'create').callsFake(() => {
        return _.cloneDeep(jobResponseBody)
      })

      const entity = await service.createJob(bookingManagerUser, jobRequestBody)
      expect(entity).to.deep.eql(jobResponseBody.dataValues)
      expect(stubDBCreate.calledOnce).to.be.true
      expect(stubPostEvent.calledOnce).to.be.true
      expect(stubGetUserId.calledOnce).to.be.true
    })

    it('create job with connect user success ', async () => {
      const stubDBCreate = sinon.stub(Job, 'create').callsFake(() => {
        return _.cloneDeep(jobResponseBody)
      })
      const entity = await service.createJob(connectUser, jobRequestBody)
      expect(entity).to.deep.eql(jobResponseBody.dataValues)
      expect(stubDBCreate.calledOnce).to.be.true
      expect(stubPostEvent.calledOnce).to.be.true
      expect(stubIsConnectMember.calledOnce).to.be.true
      expect(stubGetUserId.calledOnce).to.be.true
    })

    it('create job with connect user failed user id not exist ', async () => {
      stubGetUserId.restore()
      stubGetUserId = sinon.stub(helper, 'getUserId').callsFake(() => {
        throw new errors.NotFoundError('user id not found')
      })

      try {
        await service.createJob(_.assign({}, connectUser, { userId: 'not_exist' }), jobRequestBody)
        unexpected()
      } catch (err) {
        expect(err.message).to.equal('user id not found')
      }
      expect(stubIsConnectMember.calledOnce).to.be.true
      expect(stubGetUserId.calledOnce).to.be.true
    })

    it('create job with connect user failed ', async () => {
      isConnectMember = false
      try {
        await service.createJob(topCoderUser, jobRequestBody)
        unexpected()
      } catch (error) {
        expect(error.message).to.equal('You are not allowed to perform this action!')
      }
    })
  })

  describe('get job test', () => {
    it('get job success', async () => {
      const jobResBody = _.cloneDeep(jobResponseBody)
      const stub = sinon.stub(esClient, 'get').callsFake(async () => {
        return {
          body: {
            _id: jobResponseBody.dataValues.id,
            _source: _.omit(jobResponseBody.dataValues, ['id'])
          }
        }
      })
      const stubSearchCandidates = sinon.stub(esClient, 'search').callsFake(() => {
        return {
          body: {
            hits: {
              total: {
                value: 1
              },
              hits: [{
                _id: jobResponseBody.dataValues.candidates[0].id,
                _source: _.omit(jobResponseBody.dataValues.candidates[0], ['id'])
              }]
            }
          }
        }
      })
      const entity = await service.getJob(jobResponseBody.dataValues.id)
      expect(entity).to.deep.eql(jobResBody.dataValues)
      expect(stub.calledOnce).to.be.true
      expect(stubSearchCandidates.calledOnce).to.be.true
    })

    it('get job with job not exist failed', async () => {
      const stub = sinon.stub(esClient, 'get').callsFake(async () => {
        const err = new Error()
        err.statusCode = 404
        throw err
      })
      try {
        await service.getJob(jobResponseBody.dataValues.id)
        unexpected()
      } catch (error) {
        expect(error.message).to.equal(`id: ${jobResponseBody.dataValues.id} "Job" not found`)
        expect(stub.calledOnce).to.be.true
      }
    })

    it('get job from db success', async () => {
      const jobResBody = _.cloneDeep(jobResponseBody)
      const stub = sinon.stub(Job, 'findOne').callsFake(() => {
        return jobResBody
      })
      const entity = await service.getJob(jobResponseBody.dataValues.id, true)
      expect(entity).to.deep.eql(jobResBody.dataValues)
      expect(stub.calledOnce).to.be.true
    })

    it('get job from db with job not exist failed', async () => {
      const stub = sinon.stub(Job, 'findOne').callsFake(() => {
        return null
      })
      try {
        await service.getJob(jobResponseBody.dataValues.id, true)
        unexpected()
      } catch (error) {
        expect(error.message).to.equal(`id: ${jobResponseBody.dataValues.id} "Job" doesn't exists.`)
        expect(stub.calledOnce).to.be.true
      }
    })
  })

  describe('fully update job test', () => {
    it('fully update job test with booking manager success', async () => {
      const jobResBody = _.cloneDeep(jobResponseBody)
      const stub = sinon.stub(Job, 'findOne').onFirstCall().callsFake(() => {
        return {
          dataValues: {
            projectId: '352123'
          },
          update: () => {
            return null
          }
        }
      }).onSecondCall().callsFake(() => {
        return jobResBody
      })

      const entity = await service.fullyUpdateJob(bookingManagerUser, jobResponseBody.dataValues.id, fullyUpdateJobRequestBody)
      expect(entity).to.deep.eql(jobResBody.dataValues)
      expect(stub.calledTwice).to.be.true
      expect(stubPostEvent.calledOnce).to.be.true
      expect(stubGetUserId.calledOnce).to.be.true
    })

    it('fully update job test with connect user success', async () => {
      const jobResBody = _.cloneDeep(jobResponseBody)
      const stub = sinon.stub(Job, 'findOne').onFirstCall().callsFake(() => {
        return {
          dataValues: {
            projectId: '352123'
          },
          update: () => {
            return null
          }
        }
      }).onSecondCall().callsFake(() => {
        return jobResBody
      })

      const entity = await service.fullyUpdateJob(connectUser, jobResponseBody.dataValues.id, fullyUpdateJobRequestBody)
      expect(entity).to.deep.eql(jobResBody.dataValues)
      expect(stub.calledTwice).to.be.true
      expect(stubPostEvent.calledOnce).to.be.true
      expect(stubIsConnectMember.calledOnce).to.be.true
      expect(stubGetUserId.calledOnce).to.be.true
    })

    it('fully update job test with topcoder user failed', async () => {
      isConnectMember = false
      const stub = sinon.stub(Job, 'findOne').callsFake(() => {
        return {
          dataValues: {
            projectId: 'not_exist'
          }
        }
      })
      try {
        await service.fullyUpdateJob(topCoderUser, jobResponseBody.dataValues.id, fullyUpdateJobRequestBody)
        unexpected()
      } catch (error) {
        expect(error.message).to.equal('You are not allowed to perform this action!')
      }
      expect(stub.calledOnce).to.be.true
    })
  })

  describe('partially update job test', () => {
    it('partially update job with booking manager success', async () => {
      const jobResBody = _.cloneDeep(jobResponseBody)
      const stub = sinon.stub(Job, 'findOne').onFirstCall().callsFake(() => {
        return {
          dataValues: {
            projectId: '352123'
          },
          update: () => {
            return null
          }
        }
      }).onSecondCall().callsFake(() => {
        return jobResBody
      })

      const entity = await service.partiallyUpdateJob(bookingManagerUser, jobResponseBody.dataValues.id, partiallyUpdateJobRequestBody)
      expect(entity).to.deep.eql(jobResBody.dataValues)
      expect(stub.calledTwice).to.be.true
      expect(stubPostEvent.calledOnce).to.be.true
      expect(stubGetUserId.calledOnce).to.be.true
    })

    it('partially update job with connect user success', async () => {
      const jobResBody = _.cloneDeep(jobResponseBody)
      const stub = sinon.stub(Job, 'findOne').onFirstCall().callsFake(() => {
        return {
          dataValues: {
            projectId: '352123'
          },
          update: () => {
            return null
          }
        }
      }).onSecondCall().callsFake(() => {
        return jobResBody
      })
      const entity = await service.partiallyUpdateJob(connectUser, jobResponseBody.dataValues.id, partiallyUpdateJobRequestBody)
      expect(entity).to.deep.eql(jobResBody.dataValues)
      expect(stub.calledTwice).to.be.true
      expect(stubPostEvent.calledOnce).to.be.true
      expect(stubIsConnectMember.calledOnce).to.be.true
      expect(stubGetUserId.calledOnce).to.be.true
    })

    it('partially update job with topcoder user failed', async () => {
      isConnectMember = false
      const stub = sinon.stub(Job, 'findOne').onFirstCall().callsFake(() => {
        return {
          dataValues: {
            projectId: 'not_exist'
          }
        }
      })
      try {
        await service.partiallyUpdateJob(topCoderUser, jobResponseBody.dataValues.id, partiallyUpdateJobRequestBody)
      } catch (error) {
        expect(error.message).to.equal('You are not allowed to perform this action!')
      }
      expect(stub.calledOnce).to.be.true
    })
  })

  describe('delete job test', () => {
    it('delete job test with booking manager success', async () => {
      const stub = sinon.stub(Job, 'findOne').callsFake(() => {
        return {
          dataValues: {
            projectId: '352123'
          },
          update: () => {
            return null
          }
        }
      })
      await service.deleteJob(bookingManagerUser, jobResponseBody.dataValues.id)
      expect(stub.calledOnce).to.be.true
      expect(stubPostEvent.calledOnce).to.be.true
    })

    it('delete job test with connect user failed', async () => {
      try {
        await service.deleteJob(connectUser, jobResponseBody.dataValues.id)
        unexpected()
      } catch (error) {
        expect(error.message).to.equal('You are not allowed to perform this action!')
      }
    })

    it('delete job test with topcoder user failed', async () => {
      try {
        await service.deleteJob(topCoderUser, jobResponseBody.dataValues.id)
        unexpected()
      } catch (error) {
        expect(error.message).to.equal('You are not allowed to perform this action!')
      }
    })
  })

  describe('search jobs test', () => {
    it('search jobs success', async () => {
      const stub = sinon.stub(esClient, 'search').onFirstCall().callsFake(() => {
        return {
          body: {
            hits: {
              total: {
                value: 1
              },
              hits: [{
                _id: jobResponseBody.dataValues.id,
                _source: _.omit(jobResponseBody.dataValues, ['id'])
              }]
            }
          }
        }
      }).onSecondCall().callsFake(() => {
        return {
          body: {
            hits: {
              total: {
                value: 1
              },
              hits: [{
                _id: jobResponseBody.dataValues.candidates[0].id,
                _source: _.omit(jobResponseBody.dataValues.candidates[0], ['id'])
              }]
            }
          }
        }
      })
      const entity = await service.searchJobs({ sortBy: 'id', sortOrder: 'asc', page: 1, perPage: 1, skill: '56fdc405-eccc-4189-9e83-c78abf844f50', description: 'description 1', rateType: 'hourly' })
      expect(entity.result[0]).to.deep.eql(jobResponseBody.dataValues)
      expect(stub.calledTwice).to.be.true
    })

    it('search jobs without query parameters success', async () => {
      const stub = sinon.stub(esClient, 'search').onFirstCall().callsFake(() => {
        return {
          body: {
            hits: {
              total: {
                value: 1
              },
              hits: [{
                _id: jobResponseBody.dataValues.id,
                _source: _.omit(jobResponseBody.dataValues, ['id'])
              }]
            }
          }
        }
      }).onSecondCall().callsFake(() => {
        return {
          body: {
            hits: {
              total: {
                value: 0
              },
              hits: []
            }
          }
        }
      })
      const entity = await service.searchJobs({})
      expect(entity.result[0]).to.deep.eql(jobResponseBody.dataValues)
      expect(stub.calledTwice).to.be.true
    })

    it('search jobs success when es search fails', async () => {
      const stubESSearch = sinon.stub(esClient, 'search').callsFake(() => {
        throw new Error('dedicated es failure')
      })

      const stubDBSearch = sinon.stub(Job, 'findAll').callsFake(() => {
        return [jobResponseBody]
      })

      const entity = await service.searchJobs({ sortBy: 'id', sortOrder: 'asc', page: 1, perPage: 1, skill: '56fdc405-eccc-4189-9e83-c78abf844f50', description: 'description 1', rateType: 'hourly' })
      expect(entity.result[0]).to.deep.eql(jobResponseBody.dataValues)
      expect(stubESSearch.calledOnce).to.be.true
      expect(stubDBSearch.calledOnce).to.be.true
    })
  })
})
