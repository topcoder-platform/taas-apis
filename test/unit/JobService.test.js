/* eslint-disable no-unused-expressions */
process.env.NODE_ENV = 'test'
require('../../src/bootstrap')

const expect = require('chai').expect
const sinon = require('sinon')
const models = require('../../src/models')
const service = require('../../src/services/JobService')
const {
  bookingManagerUser, connectUser, topCoderUser, jobRequestBody,
  jobResponseBody, fullyUpdateJobRequestBody, partiallyUpdateJobRequestBody, unexpected
} = require('./common/testData')

const Job = models.Job

describe('job service test', () => {
  describe('create job test', () => {
    it('create job with booking manager user success ', async () => {
      const stub = sinon.stub(Job, 'create').callsFake(() => {
        return jobResponseBody
      })
      const entity = await service.createJob(bookingManagerUser, jobRequestBody)
      expect(entity).to.deep.eql(jobResponseBody.dataValues)
      expect(stub.calledOnce).to.be.true
      stub.restore()
    })

    it('create job with connect user success ', async () => {
      const stub = sinon.stub(Job, 'create').callsFake(() => {
        return jobResponseBody
      })
      const entity = await service.createJob(connectUser, jobRequestBody)
      expect(entity).to.deep.eql(jobResponseBody.dataValues)
      expect(stub.calledOnce).to.be.true
      stub.restore()
    })

    it('create job with connect user failed ', async () => {
      try {
        await service.createJob(topCoderUser, jobRequestBody)
        unexpected()
      } catch (error) {
        expect(error.message).to.equal('You are not allowed to perform this action!')
      }
    })
  })

  describe('get job test', () => {
    it('get jobsuccess', async () => {
      const stub = sinon.stub(Job, 'findOne').callsFake(() => {
        return jobResponseBody
      })
      const entity = await service.getJob(jobResponseBody.dataValues.id)
      expect(entity).to.deep.eql(jobResponseBody.dataValues)
      expect(stub.calledOnce).to.be.true
      stub.restore()
    })

    it('get job with job not exist failed', async () => {
      const stub = sinon.stub(Job, 'findOne').callsFake(() => {
        return null
      })
      try {
        await service.getJob(jobResponseBody.dataValues.id)
        unexpected()
      } catch (error) {
        expect(error.message).to.equal(`Job with id: ${jobResponseBody.dataValues.id} doesn't exists.`)
        expect(stub.calledOnce).to.be.true
        stub.restore()
      }
    })
  })

  describe('fully update job test', () => {
    it('fully update job test with booking manager success', async () => {
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
        return jobResponseBody
      })
      const entity = await service.fullyUpdateJob(bookingManagerUser, jobResponseBody.dataValues.id, fullyUpdateJobRequestBody)
      expect(entity).to.deep.eql(jobResponseBody.dataValues)
      expect(stub.calledTwice).to.be.true
      stub.restore()
    })

    it('fully update job test with connect user success', async () => {
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
        return jobResponseBody
      })
      const entity = await service.fullyUpdateJob(connectUser, jobResponseBody.dataValues.id, fullyUpdateJobRequestBody)
      expect(entity).to.deep.eql(jobResponseBody.dataValues)
      expect(stub.calledTwice).to.be.true
      stub.restore()
    })

    it('fully update job test with topcoder user failed', async () => {
      try {
        await service.fullyUpdateJob(topCoderUser, jobResponseBody.dataValues.id, fullyUpdateJobRequestBody)
        unexpected()
      } catch (error) {
        expect(error.message).to.equal('You are not allowed to perform this action!')
      }
    })
  })

  describe('partially update job test', () => {
    it('partially update job with booking manager success', async () => {
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
        return jobResponseBody
      })
      const entity = await service.partiallyUpdateJob(bookingManagerUser, jobResponseBody.dataValues.id, partiallyUpdateJobRequestBody)
      expect(entity).to.deep.eql(jobResponseBody.dataValues)
      expect(stub.calledTwice).to.be.true
      stub.restore()
    })

    it('partially update job with connect user success', async () => {
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
        return jobResponseBody
      })
      const entity = await service.partiallyUpdateJob(connectUser, jobResponseBody.dataValues.id, partiallyUpdateJobRequestBody)
      expect(entity).to.deep.eql(jobResponseBody.dataValues)
      expect(stub.calledTwice).to.be.true
      stub.restore()
    })

    it('partially update job with topcoder user failed', async () => {
      try {
        await service.partiallyUpdateJob(connectUser, jobResponseBody.dataValues.id, partiallyUpdateJobRequestBody)
      } catch (error) {
        expect(error.message).to.equal('You are not allowed to perform this action!')
      }
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
      stub.restore()
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
      const stub = sinon.stub(Job, 'findAndCountAll').callsFake(() => {
        return {
          count: 1,
          rows: [jobResponseBody]
        }
      })
      const entity = await service.searchJobs({ sortBy: 'id', sortOrder: 'asc', page: 1, perPage: 1, skill: '56fdc405-eccc-4189-9e83-c78abf844f50' })
      expect(entity.result[0]).to.deep.eql(jobResponseBody.dataValues)
      expect(stub.calledOnce).to.be.true
      stub.restore()
    })

    it('search jobs without query parameters success', async () => {
      const stub = sinon.stub(Job, 'findAndCountAll').callsFake(() => {
        return {
          count: 1,
          rows: [jobResponseBody]
        }
      })
      const entity = await service.searchJobs({})
      expect(entity.result[0]).to.deep.eql(jobResponseBody.dataValues)
      expect(stub.calledOnce).to.be.true
      stub.restore()
    })
  })
})
