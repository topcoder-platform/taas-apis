/**
 * WorkPeriod Processor
 */

const helper = require('../common/helper')
const config = require('config')
const esClient = helper.getESClient()

/**
  * Process create entity
  * @param {Object} entity entity object
  */
async function processCreate (entity, options) {
  // Find related resourceBooking
  const resourceBooking = await esClient.getSource({
    index: config.get('esConfig.ES_INDEX_RESOURCE_BOOKING'),
    id: entity.resourceBookingId
  })
  await esClient.update({
    index: config.get('esConfig.ES_INDEX_RESOURCE_BOOKING'),
    id: resourceBooking.body.id,
    body: {
      script: {
        lang: 'painless',
        source: 'if(!ctx._source.containsKey("workPeriods") || ctx._source.workPeriods == null){ctx._source["workPeriods"]=[]}ctx._source.workPeriods.add(params.workPeriod)',
        params: { workPeriod: entity }
      }
    },
    refresh: 'wait_for'
  })
}

/**
  * Process update entity
  * @param {Object} entity entity object
  */
async function processUpdate (entity) {
  // find workPeriod in it's parent ResourceBooking
  const resourceBooking = await esClient.search({
    index: config.get('esConfig.ES_INDEX_RESOURCE_BOOKING'),
    body: {
      query: {
        nested: {
          path: 'workPeriods',
          query: {
            match: { 'workPeriods.id': entity.id }
          }
        }
      }
    }
  })
  if (!resourceBooking.body.hits.total.value) {
    throw new Error(`id: ${entity.id} "WorkPeriod" not found`)
  }
  await esClient.update({
    index: config.get('esConfig.ES_INDEX_RESOURCE_BOOKING'),
    id: resourceBooking.body.hits.hits[0]._id,
    body: {
      script: {
        lang: 'painless',
        source: 'def wp = ctx._source.workPeriods.find(workPeriod -> workPeriod.id == params.data.id); ctx._source.workPeriods.removeIf(workPeriod -> workPeriod.id == params.data.id); params.data.payments = wp.payments; ctx._source.workPeriods.add(params.data)',
        params: { data: entity }
      }
    },
    refresh: 'wait_for'
  })
}

/**
  * Process delete entity
  * @param {Object} entity entity object
  */
async function processDelete (entity) {
  // Find related ResourceBooking
  const resourceBooking = await esClient.search({
    index: config.get('esConfig.ES_INDEX_RESOURCE_BOOKING'),
    body: {
      query: {
        nested: {
          path: 'workPeriods',
          query: {
            match: { 'workPeriods.id': entity.id }
          }
        }
      }
    }
  })
  if (!resourceBooking.body.hits.total.value) {
    const resourceBookingId = entity.key.replace('resourceBooking.id:', '')
    if (resourceBookingId) {
      try {
        await esClient.getSource({
          index: config.get('esConfig.ES_INDEX_RESOURCE_BOOKING'),
          id: resourceBookingId
        })
        if (!resourceBooking) {
          return
        }

        throw new Error(`id: ${entity.id} "WorkPeriod" not found`)
      } catch (e) {
        // if ResourceBooking is deleted, ignore
        if (e.message === 'resource_not_found_exception') {
          return
        }
        throw e
      }
    }
    // if ResourceBooking is deleted, ignore, else throw error
    if (resourceBooking) {
      throw new Error(`id: ${entity.id} "WorkPeriod" not found`)
    }
  }
  await esClient.update({
    index: config.get('esConfig.ES_INDEX_RESOURCE_BOOKING'),
    id: resourceBooking.body.hits.hits[0]._id,
    body: {
      script: {
        lang: 'painless',
        source: 'ctx._source.workPeriods.removeIf(workPeriod -> workPeriod.id == params.data.id)',
        params: { data: entity }
      }
    },
    refresh: 'wait_for'
  })
}

module.exports = {
  processCreate,
  processUpdate,
  processDelete
}
