/**
 * WorkPeriodPayment Processor
 */

const config = require('config')
const helper = require('../common/helper')

const esClient = helper.getESClient()

/**
  * Process create entity
  * @param {Object} entity entity object
  */
async function processCreate (entity) {
  // find related resourceBooking
  const resourceBooking = await esClient.search({
    index: config.get('esConfig.ES_INDEX_RESOURCE_BOOKING'),
    body: {
      query: {
        nested: {
          path: 'workPeriods',
          query: {
            match: { 'workPeriods.id': entity.workPeriodId }
          }
        }
      }
    }
  })
  if (!resourceBooking.body.hits.total.value) {
    throw new Error(`id: ${entity.workPeriodId} "WorkPeriod" not found`)
  }
  await esClient.update({
    index: config.get('esConfig.ES_INDEX_RESOURCE_BOOKING'),
    id: resourceBooking.body.hits.hits[0]._id,
    body: {
      script: {
        lang: 'painless',
        source: 'def wp = ctx._source.workPeriods.find(workPeriod -> workPeriod.id == params.workPeriodPayment.workPeriodId); if(!wp.containsKey("payments") || wp.payments == null){wp["payments"]=[]}wp.payments.add(params.workPeriodPayment)',
        params: { workPeriodPayment: entity }
      }
    },
    refresh: 'true'
  })
}

/**
  * Process update entity
  * @param {Object} entity entity object
  */
async function processUpdate (entity) {
  // find workPeriodPayment in it's parent ResourceBooking
  const resourceBooking = await esClient.search({
    index: config.get('esConfig.ES_INDEX_RESOURCE_BOOKING'),
    body: {
      query: {
        nested: {
          path: 'workPeriods.payments',
          query: {
            match: { 'workPeriods.payments.id': entity.id }
          }
        }
      }
    }
  })
  if (!resourceBooking.body.hits.total.value) {
    throw new Error(`id: ${entity.id} "WorkPeriodPayment" not found`)
  }
  await esClient.update({
    index: config.get('esConfig.ES_INDEX_RESOURCE_BOOKING'),
    id: resourceBooking.body.hits.hits[0]._id,
    body: {
      script: {
        lang: 'painless',
        source: 'def wp = ctx._source.workPeriods.find(workPeriod -> workPeriod.id == params.data.workPeriodId); wp.payments.removeIf(payment -> payment.id == params.data.id); wp.payments.add(params.data)',
        params: { data: entity }
      }
    },
    refresh: 'true'
  })
}

module.exports = {
  processCreate,
  processUpdate
}
