const models = require('../../src/models')
/**
 * Synchronizes the resource_bookings tables with the ResourceBooking model
 * It propagates any updates to the ResourceBooking model source code to the database table
 * including (new columns change, removed columns)
 * @returns {Promise<void>}
 */
const syncResourceBookings = async() => {

    /**
     * Do not set force to true - it will lead to dropping all records
     */

    await models.ResourceBooking.sync({force: false, alter: true})
}

syncResourceBookings().then(res => {
    console.log('resource_bookings table successfully synchronized')
    process.exit(0)
  }).catch(err => {
    console.log('An error happened when synchronizing the resource_bookings table')
    console.log(err)
    process.exit(1)
  })