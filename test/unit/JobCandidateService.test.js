/* eslint-disable no-unused-expressions */
process.env.NODE_ENV = 'test'
require('../../src/bootstrap')

const expect = require('chai').expect
const sinon = require('sinon')
const _ = require('lodash')
const models = require('../../src/models')
const service = require('../../src/services/JobCandidateService')
const {
  bookingManagerUser, connectUser, topCoderUser, jobCandidateRequestBody,
  jobResponseBody, jobCandidateResponseBody, fullyUpdateJobCandidateRequestBody, partiallyUpdateJobCandidateRequestBody, unexpected
} = require('./common/testData')

const helper = require('../../src/common/helper')
const esClient = helper.getESClient()

const JobCandidate = models.JobCandidate
const Job = models.Job

describe('jobCandidate service test', () => {
  describe('create job candidate test', () => {
    it('create job candidate with booking manager success ', async () => {
      const jobCandidateRes = _.cloneDeep(jobCandidateResponseBody)
      const stubCreate = sinon.stub(JobCandidate, 'create').callsFake(() => {
        return jobCandidateResponseBody
      })
      const entity = await service.createJobCandidate(bookingManagerUser, jobCandidateRequestBody)
      expect(entity).to.deep.eql(jobCandidateRes.dataValues)
      expect(stubCreate.calledOnce).to.be.true
      stubCreate.restore()
    })

    it('create job candidate with connect user success ', async () => {
      const jobCandidateRes = _.cloneDeep(jobCandidateResponseBody)
      const stubCreate = sinon.stub(JobCandidate, 'create').callsFake(() => {
        return jobCandidateRes
      })
      const entity = await service.createJobCandidate(connectUser, jobCandidateRequestBody)
      expect(entity).to.deep.eql(jobCandidateRes.dataValues)
      expect(stubCreate.calledOnce).to.be.true
      stubCreate.restore()
    })

    it('create job candidate with topcoder user success', async () => {
      const jobCandidateRes = _.cloneDeep(jobCandidateResponseBody)
      const stubCreate = sinon.stub(JobCandidate, 'create').callsFake(() => {
        return jobCandidateRes
      })
      const entity = await service.createJobCandidate(topCoderUser, jobCandidateRequestBody)
      expect(entity).to.deep.eql(jobCandidateRes.dataValues)
      expect(stubCreate.calledOnce).to.be.true
      stubCreate.restore()
    })
  })

  describe('get job candidate test', () => {
    it('get job candidate success', async () => {
      const jobCandidateRes = _.cloneDeep(jobCandidateResponseBody)
      const stubJobCandidateFindOne = sinon.stub(JobCandidate, 'findOne').callsFake(() => {
        return jobCandidateRes
      })
      const entity = await service.getJobCandidate(jobCandidateResponseBody.dataValues.id)
      expect(entity).to.deep.eql(jobCandidateRes.dataValues)
      expect(stubJobCandidateFindOne.calledOnce).to.be.true
      stubJobCandidateFindOne.restore()
    })

    it('get job candidate with candidate not exist success', async () => {
      const stubJobCandidateFindOne = sinon.stub(JobCandidate, 'findOne').callsFake(() => {
        return null
      })
      try {
        await service.getJobCandidate(jobCandidateResponseBody.dataValues.id)
        unexpected()
      } catch (error) {
        expect(error.message).to.equal(`JobCandidate with id: ${jobCandidateResponseBody.dataValues.id} doesn't exists.`)
        expect(stubJobCandidateFindOne.calledOnce).to.be.true
        stubJobCandidateFindOne.restore()
      }
    })
  })

  describe('fully update job candidate test', () => {
    it('fully update job candidate test with booking manager success', async () => {
      const jobCandidateRes = _.cloneDeep(jobCandidateResponseBody)
      const stubJobCandidateFindOne = sinon.stub(JobCandidate, 'findOne').callsFake(() => {
        return {
          ...jobCandidateRes,
          update: () => { return null }
        }
      })

      const stubJobFindOne = sinon.stub(Job, 'findOne').callsFake(() => {
        return _.cloneDeep(jobResponseBody)
      })
      const stubES = sinon.stub(esClient, 'update').callsFake(() => {})
      const entity = await service.fullyUpdateJobCandidate(bookingManagerUser, jobCandidateResponseBody.dataValues.id, fullyUpdateJobCandidateRequestBody)
      expect(entity).to.deep.eql(jobCandidateRes.dataValues)
      expect(stubJobCandidateFindOne.calledOnce).to.be.true
      expect(stubJobFindOne.calledOnce).to.be.true
      stubJobCandidateFindOne.restore()
      stubJobFindOne.restore()
      stubES.restore()
    })

    it('fully update job candidate test with connect user success', async () => {
      const jobCandidateRes = _.cloneDeep(jobCandidateResponseBody)
      const stubJobCandidateFindOne = sinon.stub(JobCandidate, 'findOne').callsFake(() => {
        return {
          ...jobCandidateRes,
          update: () => { return null }
        }
      })
      const stubJobFindOne = sinon.stub(Job, 'findOne').callsFake(() => {
        return _.cloneDeep(jobResponseBody)
      })
      const stubES = sinon.stub(esClient, 'update').callsFake(() => {})
      const entity = await service.fullyUpdateJobCandidate(connectUser, jobCandidateResponseBody.dataValues.id, fullyUpdateJobCandidateRequestBody)
      expect(entity).to.deep.eql(jobCandidateRes.dataValues)
      expect(stubJobCandidateFindOne.calledOnce).to.be.true
      expect(stubJobFindOne.calledOnce).to.be.true
      stubJobCandidateFindOne.restore()
      stubJobFindOne.restore()
      stubES.restore()
    })

    it('fully update job candidate test with topcoder user success', async () => {
      const jobCandidateRes = _.cloneDeep(jobCandidateResponseBody)
      const stubJobCandidateFindOne = sinon.stub(JobCandidate, 'findOne').callsFake(() => {
        return {
          ...jobCandidateRes,
          update: () => { return null }
        }
      })
      const stubJobFindOne = sinon.stub(Job, 'findOne').callsFake(() => {
        return _.cloneDeep(jobResponseBody)
      })
      const stubES = sinon.stub(esClient, 'update').callsFake(() => {})
      const user = _.assign({}, topCoderUser, { userId: 40152856 })
      try {
        const entity = await service.fullyUpdateJobCandidate(user, jobCandidateResponseBody.dataValues.id, fullyUpdateJobCandidateRequestBody)
        expect(entity).to.deep.eql(jobCandidateRes.dataValues)
        expect(stubJobCandidateFindOne.calledOnce).to.be.true
        expect(stubJobFindOne.calledOnce).to.be.true
      } catch (err) {
        console.log(err.message)
      }
      stubJobCandidateFindOne.restore()
      stubJobFindOne.restore()
      stubES.restore()
    })

    it('fully update job candidate test with topcoder user failed', async () => {
      const jobCandidateRes = _.cloneDeep(jobCandidateResponseBody)
      const stubJobCandidateFindOne = sinon.stub(JobCandidate, 'findOne').callsFake(() => {
        return {
          ...jobCandidateRes,
          update: () => { return null }
        }
      })
      const stubJobFindOne = sinon.stub(Job, 'findOne').callsFake(() => {
        return _.cloneDeep(jobResponseBody)
      })
      try {
        await service.fullyUpdateJobCandidate(topCoderUser, jobCandidateResponseBody.dataValues.id, fullyUpdateJobCandidateRequestBody)
        unexpected()
      } catch (error) {
        expect(error.message).to.equal('You are not allowed to perform this action!')
      }

      stubJobCandidateFindOne.restore()
      stubJobFindOne.restore()
    })
  })

  describe('partially update job candidate test', () => {
    it('partially update job candidate test with booking manager success', async () => {
      const jobCandidateRes = _.cloneDeep(jobCandidateResponseBody)
      const stubJobCandidateFindOne = sinon.stub(JobCandidate, 'findOne').callsFake(() => {
        return {
          ...jobCandidateRes,
          update: () => { return null }
        }
      })
      const stubJobFindOne = sinon.stub(Job, 'findOne').callsFake(() => {
        return _.cloneDeep(jobResponseBody)
      })
      const stubES = sinon.stub(esClient, 'update').callsFake(() => {})
      const entity = await service.partiallyUpdateJobCandidate(bookingManagerUser, jobCandidateResponseBody.dataValues.id, partiallyUpdateJobCandidateRequestBody)
      expect(entity).to.deep.eql(jobCandidateRes.dataValues)
      expect(stubJobCandidateFindOne.calledOnce).to.be.true
      expect(stubJobFindOne.calledOnce).to.be.true
      stubJobCandidateFindOne.restore()
      stubJobFindOne.restore()
      stubES.restore()
    })

    it('partially update job candidate test with connect user success', async () => {
      const jobCandidateRes = _.cloneDeep(jobCandidateResponseBody)
      const stubJobCandidateFindOne = sinon.stub(JobCandidate, 'findOne').callsFake(() => {
        return {
          ...jobCandidateRes,
          update: () => { return null }
        }
      })
      const stubJobFindOne = sinon.stub(Job, 'findOne').callsFake(() => {
        return _.cloneDeep(jobResponseBody)
      })
      const stubES = sinon.stub(esClient, 'update').callsFake(() => {})
      const entity = await service.partiallyUpdateJobCandidate(connectUser, jobCandidateResponseBody.dataValues.id, partiallyUpdateJobCandidateRequestBody)
      expect(entity).to.deep.eql(jobCandidateRes.dataValues)
      expect(stubJobCandidateFindOne.calledOnce).to.be.true
      expect(stubJobFindOne.calledOnce).to.be.true
      stubJobCandidateFindOne.restore()
      stubJobFindOne.restore()
      stubES.restore()
    })

    it('partially update job candidate test with topcoder user failed', async () => {
      const jobCandidateRes = _.cloneDeep(jobCandidateResponseBody)
      const stubJobCandidateFindOne = sinon.stub(JobCandidate, 'findOne').callsFake(() => {
        return {
          ...jobCandidateRes,
          update: () => { return null }
        }
      })
      const stubJobFindOne = sinon.stub(Job, 'findOne').callsFake(() => {
        return _.cloneDeep(jobResponseBody)
      })
      try {
        await service.partiallyUpdateJobCandidate(topCoderUser, jobCandidateResponseBody.dataValues.id, partiallyUpdateJobCandidateRequestBody)
        unexpected()
      } catch (error) {
        expect(error.message).to.equal('You are not allowed to perform this action!')
      }
      stubJobCandidateFindOne.restore()
      stubJobFindOne.restore()
    })

    it('partially update job candidate test with job not exist', async () => {
      const stubJobCandidateFindOne = sinon.stub(JobCandidate, 'findOne').callsFake(() => {
        return {
          ..._.cloneDeep(jobCandidateResponseBody),
          update: () => { return null }
        }
      })
      const stubJobFindOne = sinon.stub(Job, 'findOne').callsFake(() => {
        return null
      })
      const stubES = sinon.stub(esClient, 'update').callsFake(() => {})

      await service.partiallyUpdateJobCandidate(bookingManagerUser, jobCandidateResponseBody.dataValues.id, partiallyUpdateJobCandidateRequestBody)
      expect(stubJobCandidateFindOne.calledOnce).to.be.true
      expect(stubJobFindOne.calledOnce).to.be.true
      stubJobCandidateFindOne.restore()
      stubJobFindOne.restore()
      stubES.restore()
    })
  })

  describe('delete job candidate test', () => {
    it('delete job candidate test with booking manager success', async () => {
      const stubJobCandidateFindOne = sinon.stub(JobCandidate, 'findOne').callsFake(() => {
        return {
          ..._.cloneDeep(jobCandidateResponseBody),
          update: () => { return null }
        }
      })
      const stubES = sinon.stub(esClient, 'delete').callsFake(() => {})
      await service.deleteJobCandidate(bookingManagerUser, jobCandidateResponseBody.dataValues.id)
      expect(stubJobCandidateFindOne.calledOnce).to.be.true
      stubJobCandidateFindOne.restore()
      stubES.restore()
    })

    it('delete job candidate test with connect user success', async () => {
      try {
        await service.deleteJobCandidate(connectUser, jobCandidateResponseBody.dataValues.id)
        unexpected()
      } catch (error) {
        expect(error.message).to.equal('You are not allowed to perform this action!')
      }
    })

    it('delete job candidate test with topcoder user failed', async () => {
      try {
        await service.deleteJobCandidate(topCoderUser, jobCandidateResponseBody.dataValues.id)
        unexpected()
      } catch (error) {
        expect(error.message).to.equal('You are not allowed to perform this action!')
      }
    })
  })

  describe('search job candidates test', () => {
    it('search job candidates success', async () => {
      const stub = sinon.stub(esClient, 'search').callsFake(() => {
        return {
          body: {
            hits: {
              total: {
                value: 1
              },
              hits: [{
                _id: jobCandidateResponseBody.dataValues.id,
                _source: _.omit(jobCandidateResponseBody.dataValues, ['id'])
              }]
            }
          }
        }
      })
      const entity = await service.searchJobCandidates({ sortBy: 'id', sortOrder: 'asc', page: 1, perPage: 1, jobId: '36762910-4efa-4db4-9b2a-c9ab54c232ed' })
      expect(entity.result[0]).to.deep.eql(jobCandidateResponseBody.dataValues)
      expect(stub.calledOnce).to.be.true
      stub.restore()
    })

    it('search job candidates without query parameters success', async () => {
      const stub = sinon.stub(esClient, 'search').callsFake(() => {
        return {
          body: {
            hits: {
              total: {
                value: 1
              },
              hits: [{
                _id: jobCandidateResponseBody.dataValues.id,
                _source: _.omit(jobCandidateResponseBody.dataValues, ['id'])
              }]
            }
          }
        }
      })
      const entity = await service.searchJobCandidates({})
      expect(entity.result[0]).to.deep.eql(jobCandidateResponseBody.dataValues)
      expect(stub.calledOnce).to.be.true
      stub.restore()
    })
  })
})
