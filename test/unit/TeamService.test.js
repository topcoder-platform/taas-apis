/* eslint-disable no-unused-expressions */
process.env.NODE_ENV = 'test'
require('../../src/bootstrap')

const expect = require('chai').expect
const sinon = require('sinon')

const service = require('../../src/services/TeamService')
const JobService = require('../../src/services/JobService')
const ResourceBookingService = require('../../src/services/ResourceBookingService')
const {
  bookingManagerUser,
  unexpected,
  projectRequestBody,
  userRequestBody,
  memberRequestBody,
  skillsRequestBody,
  userSkillsRequestBody,
  resourceBookingsRequestBody,
  jobsRequestBody,
  taasTeamItem0ResponseBody,
  taasTeam9050ResponseBody,
  jobDetailResponseBody
} = require('./common/testData')
const helper = require('../../src/common/helper')

describe('Team service test', () => {
  let stubGetProjects
  let stubGetProjectById
  let stubGetUsers
  let stubGetMembers
  let stubGetSkills
  let stubGetUserSkill
  let stubGetAssignedResourceBookings
  let stubGetJobs
  beforeEach(() => {
    stubGetProjects = sinon.stub(helper, 'getProjects').callsFake(() => {
      return projectRequestBody
    })

    stubGetProjectById = sinon.stub(helper, 'getProjectById').callsFake(() => {
      return projectRequestBody[0]
    })

    stubGetUsers = sinon.stub(helper, 'getUsers').callsFake(() => {
      return userRequestBody
    })

    stubGetMembers = sinon.stub(helper, 'getMembers').callsFake(() => {
      return memberRequestBody
    })

    stubGetSkills = sinon.stub(helper, 'getSkills').callsFake(() => {
      return skillsRequestBody
    })

    stubGetUserSkill = sinon.stub(helper, 'getUserSkill').callsFake(() => {
      return userSkillsRequestBody
    })

    stubGetAssignedResourceBookings = sinon.stub(ResourceBookingService, 'searchResourceBookings').callsFake(() => {
      return { result: resourceBookingsRequestBody }
    })

    stubGetJobs = sinon.stub(JobService, 'searchJobs').callsFake(() => {
      return { result: jobsRequestBody }
    })
  })

  afterEach(() => {
    sinon.restore()
  })

  describe('search teams test', () => {
    beforeEach(() => {
      stubGetAssignedResourceBookings.restore()
      stubGetAssignedResourceBookings = sinon.stub(ResourceBookingService, 'searchResourceBookings').callsFake(() => {
        return { result: resourceBookingsRequestBody }
      })
      stubGetJobs.restore()
      stubGetJobs = sinon.stub(JobService, 'searchJobs').callsFake(() => {
        return { result: jobsRequestBody }
      })
    })

    it('search teams success ', async () => {
      const entity = await service.searchTeams(bookingManagerUser)
      expect(entity.length).to.equal(20)
      expect(entity[0]).to.deep.eql(taasTeamItem0ResponseBody)
      expect(stubGetProjects.calledOnce).to.be.true
      expect(stubGetUsers.calledOnce).to.be.true
      expect(stubGetMembers.called).to.be.true
      expect(stubGetAssignedResourceBookings.calledOnce).to.be.true
      expect(stubGetJobs.calledOnce).to.be.true
    })

    it('search teams success with no resourceBooking ', async () => {
      stubGetAssignedResourceBookings.restore()
      stubGetAssignedResourceBookings = sinon.stub(ResourceBookingService, 'searchResourceBookings').callsFake(() => {
        return { result: [] }
      })
      stubGetJobs.restore()
      stubGetJobs = sinon.stub(JobService, 'searchJobs').callsFake(() => {
        return { result: [] }
      })

      const entity = await service.searchTeams(bookingManagerUser)
      expect(entity.length).to.equal(20)
      expect(entity[0]).to.deep.eql({
        id: 9050,
        name: 'sample',
        weeklyCount: 0,
        resources: []
      })
      expect(stubGetProjects.calledOnce).to.be.true
      expect(stubGetAssignedResourceBookings.calledOnce).to.be.true
      expect(stubGetJobs.calledOnce).to.be.true
    })

    it('search teams success with no null start date', async () => {
      stubGetAssignedResourceBookings.restore()
      stubGetAssignedResourceBookings = sinon.stub(ResourceBookingService, 'searchResourceBookings').callsFake(() => {
        return {
          result: [{
            projectId: 9050,
            userId: '1b88e433-828b-4e0d-9fb5-ef75b9dcca6e',
            jobId: '1d9e8c1a-e653-4d31-a799-2685e41da212',
            startDate: null,
            endDate: null,
            memberRate: 13.23,
            customerRate: 13,
            rateType: 'hourly',
            status: 'assigned',
            createdAt: '2020-11-11T04:17:23.131Z',
            createdBy: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
            id: '3d9e8c1a-e653-4d31-a799-2685e41da212'
          }]
        }
      })

      const entity = await service.searchTeams(bookingManagerUser)
      expect(entity.length).to.equal(20)
      expect(stubGetProjects.calledOnce).to.be.true
      expect(stubGetAssignedResourceBookings.calledOnce).to.be.true
      expect(stubGetJobs.calledOnce).to.be.true
    })

    it('search teams success with no empty user infos', async () => {
      stubGetAssignedResourceBookings.restore()
      stubGetAssignedResourceBookings = sinon.stub(ResourceBookingService, 'searchResourceBookings').callsFake(() => {
        return {
          result: [{
            projectId: 9050,
            userId: 'not exist',
            jobId: '1d9e8c1a-e653-4d31-a799-2685e41da212',
            startDate: null,
            endDate: null,
            memberRate: 13.23,
            customerRate: 13,
            rateType: 'hourly',
            status: 'assigned',
            createdAt: '2020-11-11T04:17:23.131Z',
            createdBy: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
            id: '3d9e8c1a-e653-4d31-a799-2685e41da212'
          }]
        }
      })

      const entity = await service.searchTeams(bookingManagerUser)
      expect(entity.length).to.equal(20)
      expect(stubGetProjects.calledOnce).to.be.true
      expect(stubGetAssignedResourceBookings.calledOnce).to.be.true
      expect(stubGetJobs.calledOnce).to.be.true
    })
  })

  describe('get team by id test', () => {
    beforeEach(() => {
      stubGetUserSkill.restore()
      stubGetUserSkill = sinon.stub(helper, 'getUserSkill').callsFake(() => {
        return userSkillsRequestBody
      })
    })

    it('get team by id success ', async () => {
      const entity = await service.getTeam(bookingManagerUser, 9050)
      expect(entity).to.deep.eql(taasTeam9050ResponseBody)
      expect(stubGetProjectById.calledOnce).to.be.true
      expect(stubGetUsers.calledOnce).to.be.true
      expect(stubGetMembers.called).to.be.true
      expect(stubGetAssignedResourceBookings.calledOnce).to.be.true
      expect(stubGetJobs.calledOnce).to.be.true
      expect(stubGetSkills.calledOnce).to.be.true
      expect(stubGetUserSkill.called).to.be.true
    })

    it('get team by id with no user skills', async () => {
      stubGetUserSkill.restore()
      stubGetUserSkill = sinon.stub(helper, 'getUserSkill').callsFake(() => {
        return []
      })

      const entity = await service.getTeam(bookingManagerUser, 9050)
      expect(entity.resources[0].skillMatched).to.equal(0)
      expect(stubGetProjectById.calledOnce).to.be.true
      expect(stubGetAssignedResourceBookings.calledOnce).to.be.true
      expect(stubGetJobs.calledOnce).to.be.true
    })
  })

  describe('get job by team id and job id test', () => {
    beforeEach(() => {
      stubGetUserSkill.restore()
      stubGetUserSkill = sinon.stub(helper, 'getUserSkill').callsFake(() => {
        return userSkillsRequestBody
      })
      stubGetMembers.restore()
      stubGetMembers = sinon.stub(helper, 'getMembers').callsFake(() => {
        return memberRequestBody
      })
      stubGetUsers.restore()
      stubGetUsers = sinon.stub(helper, 'getUsers').callsFake(() => {
        return userRequestBody
      })
    })

    it('get job detail by id success ', async () => {
      const entity = await service.getTeamJob(bookingManagerUser, 9050, '1d9e8c1a-e653-4d31-a799-2685e41da212')
      expect(entity).to.deep.eql(jobDetailResponseBody)
      expect(stubGetJobs.calledOnce).to.be.true
      expect(stubGetUsers.called).to.be.true
      expect(stubGetMembers.called).to.be.true
      expect(stubGetUserSkill.called).to.be.true
    })

    it('get job detail by not exist id success ', async () => {
      const entity = await service.getTeamJob(bookingManagerUser, 9050, '1d9e8c1a-e653-4d31-a799-2685e41da999')
      expect(entity).to.be.a('object')
      expect(stubGetJobs.calledOnce).to.be.true
    })

    it('get job detail by invalid id ', async () => {
      try {
        await service.getTeamJob(bookingManagerUser, 9050, 'invalid')
        unexpected()
      } catch (error) {
        expect(error.message).to.equal('"jobId" must be a valid GUID')
      }
    })

    it('get team by id with no user skills', async () => {
      stubGetUserSkill.restore()
      stubGetUserSkill = sinon.stub(helper, 'getUserSkill').callsFake(() => {
        return []
      })

      const entity = await service.getTeamJob(bookingManagerUser, 9050, '1d9e8c1a-e653-4d31-a799-2685e41da212')
      expect(entity.candidates[0].skillMatched).to.equal(0)
      expect(stubGetJobs.calledOnce).to.be.true
      expect(stubGetUsers.called).to.be.true
      expect(stubGetMembers.called).to.be.true
      expect(stubGetUserSkill.called).to.be.true
    })

    it('get job detail by id with photoURL ', async () => {
      stubGetMembers.restore()
      stubGetMembers = sinon.stub(helper, 'getMembers').callsFake(() => {
        return [{
          userId: 8547893,
          handleLower: 'sandrine_kuvalis98',
          photoURL: 'https://topcoder-dev-media.s3.amazonaws.com/member/profile/TonyJ-1604301092491.jpeg'
        }]
      })

      const entity = await service.getTeamJob(bookingManagerUser, 9050, '1d9e8c1a-e653-4d31-a799-2685e41da212')
      expect(entity.candidates[0].photo_url).to.be.a('string')
      expect(stubGetJobs.calledOnce).to.be.true
      expect(stubGetUsers.called).to.be.true
      expect(stubGetMembers.called).to.be.true
      expect(stubGetUserSkill.called).to.be.true
    })

    it('get job detail by id empty users ', async () => {
      stubGetUsers.restore()
      stubGetUsers = sinon.stub(helper, 'getUsers').callsFake(() => {
        return []
      })

      const entity = await service.getTeamJob(bookingManagerUser, 9050, '1d9e8c1a-e653-4d31-a799-2685e41da212')
      expect(entity.candidates.length).to.equal(0)
    })
  })
})
