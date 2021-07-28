/*
 * update WorkPeriod field `sentSurvey=true`
 */
const _ = require('lodash')
const moment = require('moment')
const logger = require('../../src/common/logger')
const { Op } = require('sequelize')
const models = require('../../src/models')

const ResourceBooking = models.ResourceBooking
const WorkPeriod = models.WorkPeriod

async function updateWorkPeriod () {
  const transaction = await models.sequelize.transaction()
  try {
    // Start a transaction
    const queryCriteria = {
      attributes: ['sendWeeklySurvey', 'id'],
      include: [{
        as: 'workPeriods',
        model: WorkPeriod,
        required: true,
        where: {
          [Op.and]: [
            { sentSurveyError: null },
            { sentSurvey: false },
            { paymentStatus: ['completed'] },
            { endDate: { [Op.lte]: moment().subtract(7, 'days').format('YYYY-MM-DD') } }
          ]
        }
      }],
      where: {
        [Op.and]: [{ sendWeeklySurvey: true }]
      },
      transaction
    }

    const resourceBookings = await ResourceBooking.findAll(queryCriteria)

    _.forEach(resourceBookings, r => {
      _.forEach(r.workPeriods, async w => {
        // await w.update({sentSurvey: true}, {transaction: transaction} )
        await w.update({ sentSurvey: true })
      })
    })

    // commit transaction only if all things went ok
    logger.info({
      component: 'importData',
      message: 'committing transaction to database...'
    })
    await transaction.commit()
  } catch (error) {
    // logger.error({
    //   component: 'importData',
    //   message: `Error while writing data of model: WorkPeriod`
    // })
    // rollback all insert operations
    if (transaction) {
      logger.info({
        component: 'importData',
        message: 'rollback database transaction...'
      })
      transaction.rollback()
    }
  }
}
updateWorkPeriod()
