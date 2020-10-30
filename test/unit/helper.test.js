/* eslint-disable no-unused-expressions */
process.env.NODE_ENV = 'test'

require('../../src/bootstrap')
const _ = require('lodash')
const sinon = require('sinon')
const rewire = require('rewire')
const request = require('superagent')
const expect = require('chai').expect
const helper = rewire('../../src/common/helper')

describe('helper test', () => {
  before(() => {

  })
  beforeEach(() => {
    sinon.restore()
  })

  describe('setResHeaders test', () => {
    const req = {
      protocol: 'http',
      baseUrl: 'api/v5',
      path: '/jobs',
      get: () => {
        return 'localhost:3000'
      }
    }
    const res = {
      set (key, value) {
        this[key] = value
      },
      get (key) {
        return 'test'
      }
    }

    const result = {
      total: 4,
      page: 2,
      perPage: 2

    }
    it('setResHeaders test', () => {
      const temp = _.cloneDeep(res)
      helper.setResHeaders(req, temp, result)
      expect(_.omit(temp, ['get', 'set'])).to.eql({
        'X-Prev-Page': 1,
        'X-Page': 2,
        'X-Per-Page': 2,
        'X-Total': 4,
        'X-Total-Pages': 2,
        Link: '<http://localhost:3000api/v5/jobs?page=1>; rel="first", <http://localhost:3000api/v5/jobs?page=2>; rel="last", <http://localhost:3000api/v5/jobs?page=1>; rel="prev"',
        'Access-Control-Expose-Headers': 'test, X-Page, X-Per-Page, X-Total, X-Total-Pages, X-Prev-Page, X-Next-Page'
      })
    })

    it('setResHeaders test with totalPages > 0', () => {
      const temp1 = _.assign({}, result, { total: 40 })
      const temp2 = _.cloneDeep(res)
      helper.setResHeaders(req, temp2, temp1)
      expect(_.omit(temp2, ['get', 'set'])).to.eql({
        'X-Prev-Page': 1,
        'X-Next-Page': 3,
        'X-Page': 2,
        'X-Per-Page': 2,
        'X-Total': 40,
        'X-Total-Pages': 20,
        Link: '<http://localhost:3000api/v5/jobs?page=1>; rel="first", <http://localhost:3000api/v5/jobs?page=20>; rel="last", <http://localhost:3000api/v5/jobs?page=1>; rel="prev", <http://localhost:3000api/v5/jobs?page=3>; rel="next"',
        'Access-Control-Expose-Headers': 'test, X-Page, X-Per-Page, X-Total, X-Total-Pages, X-Prev-Page, X-Next-Page'
      })
    })

    it('setResHeaders test with page = 1 and res.get returns null', () => {
      const temp1 = _.assign({}, result, { total: 40, page: 1 })
      const temp2 = _.assign({}, res, { get (key) { return null } })
      helper.setResHeaders(req, temp2, temp1)
      expect(_.omit(temp2, ['get', 'set'])).to.eql({
        'X-Next-Page': 2,
        'X-Page': 1,
        'X-Per-Page': 2,
        'X-Total': 40,
        'X-Total-Pages': 20,
        Link: '<http://localhost:3000api/v5/jobs?page=1>; rel="first", <http://localhost:3000api/v5/jobs?page=20>; rel="last", <http://localhost:3000api/v5/jobs?page=2>; rel="next"',
        'Access-Control-Expose-Headers': 'X-Page, X-Per-Page, X-Total, X-Total-Pages, X-Prev-Page, X-Next-Page'
      })
    })

    it('setResHeaders test with total = 0', () => {
      const temp1 = _.assign({}, result, { total: 0 })
      const temp2 = _.assign({}, res, { get (key) { return null } })
      helper.setResHeaders(req, temp2, temp1)
      expect(_.omit(temp2, ['get', 'set'])).to.eql({
        'X-Prev-Page': 1,
        'X-Page': 2,
        'X-Per-Page': 2,
        'X-Total': 0,
        'X-Total-Pages': 0,
        'Access-Control-Expose-Headers': 'X-Page, X-Per-Page, X-Total, X-Total-Pages, X-Prev-Page, X-Next-Page'
      })
    })
  })

  describe('clearObject test', () => {
    it('clearObject test with null', () => {
      expect(helper.clearObject(null)).to.be.undefined
    })

    it('clearObject test with array', () => {
      const arr = [{ test: 'ok' }, { test: 'ok' }, { test: 'ok' }]
      expect(helper.clearObject(arr)).to.eql(arr)
    })
  })

  describe('autoWrapExpress test', () => {
    it('autoWrapExpress with sync function', () => {
      const fn = () => { return null }
      const res = helper.autoWrapExpress(fn)
      expect(fn).to.eql(res)
    })

    it('autoWrapExpress with async function', () => {
      const fn = async () => { return null }
      const res = helper.autoWrapExpress(fn)
      res()
      expect(res).to.be.a('function')
    })

    it('autoWrapExpress with function array', () => {
      const fn = [() => { return null }]
      const res = helper.autoWrapExpress(fn)
      expect(res).to.be.a('array')
    })

    it('autoWrapExpress with object', () => {
      const obj = {
        fn: () => { return null }
      }
      const res = helper.autoWrapExpress(obj)
      expect(res).to.be.a('object')
      expect(res.fn).to.be.a('function')
    })
  })

  describe('getUserId test', () => {
    it('isConnectMember return true', async () => {
      sinon.stub(request, 'get').callsFake(() => {
        return {
          set: function () {
            return this
          }
        }
      })
      const res = await helper.isConnectMember()
      expect(res).to.be.true
    })

    it('isConnectMember return false', async () => {
      let i = 0
      sinon.stub(request, 'get').callsFake(() => {
        return {
          set: function () {
            i++
            if (i === 3) {
              throw new Error()
            }
            return this
          }
        }
      })
      const res = await helper.isConnectMember()
      expect(res).to.be.false
    })
  })

  describe('getUserId test', () => {
    const id = '9966a0cf-c1c9-457b-9a4b-e6d1f4cec88d'
    it('getUserId return id', async () => {
      let i = 0
      sinon.stub(request, 'get').callsFake(() => {
        return {
          set: function () {
            i++
            if (i === 3) {
              return {
                body: [{ id }]
              }
            }
            return this
          }
        }
      })
      helper.__set__('m2m', {
        getMachineToken: function () {
          return 'm2mToken'
        }
      })
      const res = await helper.getUserId(8547899)
      expect(res).to.equal(id)
    })

    it('getUserId return id', async () => {
      let i = 0
      sinon.stub(request, 'get').callsFake(() => {
        return {
          set: function () {
            i++
            if (i === 3) {
              return {
                body: []
              }
            }
            return this
          }
        }
      })
      helper.__set__('m2m', {
        getMachineToken: function () {
          return 'm2mToken'
        }
      })
      try {
        await helper.getUserId(44532)
      } catch (err) {
        expect(err.message).to.equal('user id not found')
      }
    })
  })
})
