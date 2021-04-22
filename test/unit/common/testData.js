
const currentUser = {
  userId: '00000000-0000-0000-0000-000000000000',
  isMachine: true
}
const UserTCConnCopilot = {
  userId: '4709473d-f060-4102-87f8-4d51ff0b34c1',
  handle: 'TCConnCopilot'
}
const resourceBooking5Week = {
  request: {
    projectId: 21,
    userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
    jobId: '36762910-4efa-4db4-9b2a-c9ab54c232ed',
    startDate: '2020-09-27T04:17:23.131Z',
    endDate: '2020-10-27T04:17:23.131Z',
    memberRate: 13.23,
    customerRate: 13,
    rateType: 'hourly'
  },
  response: {
    dataValues: {
      id: '520bb632-a02a-415e-9857-93b2ecbf7d60',
      projectId: 21,
      userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
      jobId: '6093e58c-683d-4022-8482-5515e8345016',
      startDate: '2020-09-27T04:17:23.131Z',
      endDate: '2020-10-27T04:17:23.131Z',
      memberRate: 13.23,
      customerRate: 13,
      rateType: 'hourly',
      createdAt: '2020-10-09T04:24:01.048Z',
      createdBy: '57646ff9-1cd3-4d3c-88ba-eb09a395366c',
      status: 'sourcing'
    }
  },
  workPeriodRequests: [{
    resourceBookingId: '520bb632-a02a-415e-9857-93b2ecbf7d60',
    startDate: '2020-09-27',
    endDate: '2020-10-03',
    daysWorked: 5,
    paymentStatus: 'pending'
  },
  {
    resourceBookingId: '520bb632-a02a-415e-9857-93b2ecbf7d60',
    startDate: '2020-10-04',
    endDate: '2020-10-10',
    daysWorked: 5,
    paymentStatus: 'pending'
  },
  {
    resourceBookingId: '520bb632-a02a-415e-9857-93b2ecbf7d60',
    startDate: '2020-10-11',
    endDate: '2020-10-17',
    daysWorked: 5,
    paymentStatus: 'pending'
  },
  {
    resourceBookingId: '520bb632-a02a-415e-9857-93b2ecbf7d60',
    startDate: '2020-10-18',
    endDate: '2020-10-24',
    daysWorked: 5,
    paymentStatus: 'pending'
  },
  {
    resourceBookingId: '520bb632-a02a-415e-9857-93b2ecbf7d60',
    startDate: '2020-10-25',
    endDate: '2020-10-31',
    daysWorked: 2,
    paymentStatus: 'pending'
  }]
}
resourceBooking5Week.response.toJSON = function () {
  return resourceBooking5Week.response.dataValues
}
const resourceBooking1Week = {
  request: {
    projectId: 21,
    userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
    jobId: '36762910-4efa-4db4-9b2a-c9ab54c232ed',
    startDate: '2020-11-20T04:17:23.131Z',
    endDate: '2020-11-21T04:17:23.131Z',
    memberRate: 13.23,
    customerRate: 13,
    rateType: 'hourly'
  },
  response: {
    dataValues: {
      id: '520bb632-a02a-415e-9857-93b2ecbf7d60',
      projectId: 21,
      userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
      jobId: '6093e58c-683d-4022-8482-5515e8345016',
      startDate: '2020-11-20T04:17:23.131Z',
      endDate: '2020-11-21T04:17:23.131Z',
      memberRate: 13.23,
      customerRate: 13,
      rateType: 'hourly',
      createdAt: '2020-10-09T04:24:01.048Z',
      createdBy: '57646ff9-1cd3-4d3c-88ba-eb09a395366c',
      status: 'sourcing'
    }
  },
  workPeriodRequests: [{
    resourceBookingId: '520bb632-a02a-415e-9857-93b2ecbf7d60',
    startDate: '2020-11-15',
    endDate: '2020-11-21',
    daysWorked: 2,
    paymentStatus: 'pending'
  }],
  workPeriodResponse: [{
    id: '10faf505-d0e3-4d13-a817-7f1319625e91',
    resourceBookingId: '520bb632-a02a-415e-9857-93b2ecbf7d60',
    userHandle: 'pshah_manager',
    projectId: 21,
    startDate: '2020-11-15',
    endDate: '2020-11-21',
    daysWorked: 2,
    memberRate: null,
    customerRate: null,
    paymentStatus: 'pending',
    createdBy: '00000000-0000-0000-0000-000000000000',
    updatedBy: null,
    createdAt: '2021-04-10T22:25:08.289Z',
    updatedAt: '2021-04-10T22:25:08.289Z'
  }],
  updateRequest: {
    startDate: '2020-11-18T04:17:23.131Z'
  },
  updateResponse: {
    dataValues: {
      id: '520bb632-a02a-415e-9857-93b2ecbf7d60',
      projectId: 21,
      userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
      jobId: '6093e58c-683d-4022-8482-5515e8345016',
      startDate: new Date('2020-11-18T04:17:23.131Z'),
      endDate: '2020-11-21T04:17:23.131Z',
      memberRate: 13.23,
      customerRate: 13,
      rateType: 'hourly',
      createdAt: '2020-10-09T04:24:01.048Z',
      createdBy: '57646ff9-1cd3-4d3c-88ba-eb09a395366c',
      updatedBy: '00000000-0000-0000-0000-000000000000',
      status: 'sourcing'
    }
  },
  workPeriodUpdateRequests: [{
    daysWorked: 4
  }]
}
resourceBooking1Week.response.toJSON = function () {
  return resourceBooking1Week.response.dataValues
}
resourceBooking1Week.updateResponse.toJSON = function () {
  return resourceBooking1Week.updateResponse.dataValues
}
resourceBooking1Week.response.update = function () {
  return resourceBooking1Week.updateResponse
}
const resourceBookingUpdate = {
  response: {
    dataValues: {
      id: '520bb632-a02a-415e-9857-93b2ecbf7d60',
      projectId: 21,
      userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
      jobId: '6093e58c-683d-4022-8482-5515e8345016',
      startDate: '2020-08-20T04:17:23.131Z',
      endDate: '2020-09-10T04:17:23.131Z',
      memberRate: 13.23,
      customerRate: 13,
      rateType: 'hourly',
      createdAt: '2020-10-09T04:24:01.048Z',
      createdBy: '57646ff9-1cd3-4d3c-88ba-eb09a395366c',
      status: 'sourcing'
    }
  },
  workPeriodResponse: [{
    id: '10faf505-d0e3-4d13-a817-7f1319625e91',
    resourceBookingId: '520bb632-a02a-415e-9857-93b2ecbf7d60',
    userHandle: 'pshah_manager',
    projectId: 21,
    startDate: '2020-08-16',
    endDate: '2020-08-22',
    daysWorked: 2,
    memberRate: null,
    customerRate: null,
    paymentStatus: 'pending',
    createdBy: '00000000-0000-0000-0000-000000000000',
    updatedBy: null,
    createdAt: '2021-04-10T22:25:08.289Z',
    updatedAt: '2021-04-10T22:25:08.289Z'
  }, {
    id: 'b18398fe-09d0-4671-95b9-a4f56e6c6879',
    resourceBookingId: '520bb632-a02a-415e-9857-93b2ecbf7d60',
    userHandle: 'pshah_manager',
    projectId: 21,
    startDate: '2020-08-23',
    endDate: '2020-08-29',
    daysWorked: 5,
    memberRate: null,
    customerRate: null,
    paymentStatus: 'pending',
    createdBy: '00000000-0000-0000-0000-000000000000',
    updatedBy: null,
    createdAt: '2021-04-10T22:25:08.289Z',
    updatedAt: '2021-04-10T22:25:08.289Z'
  }, {
    id: 'de811f42-cae7-4cb7-8893-d1e1f83b998f',
    resourceBookingId: '520bb632-a02a-415e-9857-93b2ecbf7d60',
    userHandle: 'pshah_manager',
    projectId: 21,
    startDate: '2020-08-30',
    endDate: '2020-09-05',
    daysWorked: 5,
    memberRate: null,
    customerRate: null,
    paymentStatus: 'pending',
    createdBy: '00000000-0000-0000-0000-000000000000',
    updatedBy: null,
    createdAt: '2021-04-10T22:25:08.289Z',
    updatedAt: '2021-04-10T22:25:08.289Z'
  }, {
    id: '171e7f32-36fd-4969-9a99-036ced807d53',
    resourceBookingId: '520bb632-a02a-415e-9857-93b2ecbf7d60',
    userHandle: 'pshah_manager',
    projectId: 21,
    startDate: '2020-09-06',
    endDate: '2020-09-12',
    daysWorked: 4,
    memberRate: null,
    customerRate: null,
    paymentStatus: 'pending',
    createdBy: '00000000-0000-0000-0000-000000000000',
    updatedBy: null,
    createdAt: '2021-04-10T22:25:08.289Z',
    updatedAt: '2021-04-10T22:25:08.289Z'
  }],
  updateRequest: {
    endDate: '2020-09-12T04:17:23.131Z'
  },
  updateResponse: {
    dataValues: {
      id: '520bb632-a02a-415e-9857-93b2ecbf7d60',
      projectId: 21,
      userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
      jobId: '6093e58c-683d-4022-8482-5515e8345016',
      startDate: '2020-08-20T04:17:23.131Z',
      endDate: new Date('2020-09-12T04:17:23.131Z'),
      memberRate: 13.23,
      customerRate: 13,
      rateType: 'hourly',
      createdAt: '2020-10-09T04:24:01.048Z',
      createdBy: '57646ff9-1cd3-4d3c-88ba-eb09a395366c',
      updatedBy: '00000000-0000-0000-0000-000000000000',
      status: 'sourcing'
    }
  },
  workPeriodUpdateRequests: [{
    daysWorked: 5
  }],
  response2: {
    dataValues: {
      id: '520bb632-a02a-415e-9857-93b2ecbf7d60',
      projectId: 21,
      userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
      jobId: '6093e58c-683d-4022-8482-5515e8345016',
      startDate: '2020-08-20T04:17:23.131Z',
      endDate: '2020-09-10T04:17:23.131Z',
      memberRate: 13.23,
      customerRate: 13,
      rateType: 'hourly',
      createdAt: '2020-10-09T04:24:01.048Z',
      createdBy: '57646ff9-1cd3-4d3c-88ba-eb09a395366c',
      status: 'sourcing'
    }
  },
  updateRequest2: {
    endDate: '2020-09-15T04:17:23.131Z'
  },
  updateResponse2: {
    dataValues: {
      id: '520bb632-a02a-415e-9857-93b2ecbf7d60',
      projectId: 21,
      userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
      jobId: '6093e58c-683d-4022-8482-5515e8345016',
      startDate: '2020-08-20T04:17:23.131Z',
      endDate: new Date('2020-09-15T04:17:23.131Z'),
      memberRate: 13.23,
      customerRate: 13,
      rateType: 'hourly',
      createdAt: '2020-10-09T04:24:01.048Z',
      createdBy: '57646ff9-1cd3-4d3c-88ba-eb09a395366c',
      updatedBy: '00000000-0000-0000-0000-000000000000',
      status: 'sourcing'
    }
  },
  workPeriodUpdateRequests2: [{
    daysWorked: 5
  }, {
    resourceBookingId: '520bb632-a02a-415e-9857-93b2ecbf7d60',
    startDate: '2020-09-13',
    endDate: '2020-09-19',
    daysWorked: 2,
    paymentStatus: 'pending'
  }],
  response3: {
    dataValues: {
      id: '520bb632-a02a-415e-9857-93b2ecbf7d60',
      projectId: 21,
      userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
      jobId: '6093e58c-683d-4022-8482-5515e8345016',
      startDate: '2020-08-20T04:17:23.131Z',
      endDate: '2020-09-10T04:17:23.131Z',
      memberRate: 13.23,
      customerRate: 13,
      rateType: 'hourly',
      createdAt: '2020-10-09T04:24:01.048Z',
      createdBy: '57646ff9-1cd3-4d3c-88ba-eb09a395366c',
      status: 'sourcing'
    }
  },
  updateRequest3: {
    startDate: '2020-08-25T04:17:23.131Z'
  },
  updateResponse3: {
    dataValues: {
      id: '520bb632-a02a-415e-9857-93b2ecbf7d60',
      projectId: 21,
      userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
      jobId: '6093e58c-683d-4022-8482-5515e8345016',
      startDate: new Date('2020-08-25T04:17:23.131Z'),
      endDate: '2020-09-10T04:17:23.131Z',
      memberRate: 13.23,
      customerRate: 13,
      rateType: 'hourly',
      createdAt: '2020-10-09T04:24:01.048Z',
      createdBy: '57646ff9-1cd3-4d3c-88ba-eb09a395366c',
      updatedBy: '00000000-0000-0000-0000-000000000000',
      status: 'sourcing'
    }
  },
  workPeriodUpdateRequests3: [
    'b18398fe-09d0-4671-95b9-a4f56e6c6879', {
      daysWorked: 4
    },
    '10faf505-d0e3-4d13-a817-7f1319625e91',
    '10faf505-d0e3-4d13-a817-7f1319625e91',
    'b18398fe-09d0-4671-95b9-a4f56e6c6879',
    'de811f42-cae7-4cb7-8893-d1e1f83b998f',
    '171e7f32-36fd-4969-9a99-036ced807d53'
  ],
  response4: {
    dataValues: {
      id: '520bb632-a02a-415e-9857-93b2ecbf7d60',
      projectId: 21,
      userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
      jobId: '6093e58c-683d-4022-8482-5515e8345016',
      startDate: '2020-08-20T04:17:23.131Z',
      endDate: '2020-09-10T04:17:23.131Z',
      memberRate: 13.23,
      customerRate: 13,
      rateType: 'hourly',
      createdAt: '2020-10-09T04:24:01.048Z',
      createdBy: '57646ff9-1cd3-4d3c-88ba-eb09a395366c',
      status: 'sourcing'
    }
  },
  workPeriodResponse4: [{
    id: '10faf505-d0e3-4d13-a817-7f1319625e91',
    resourceBookingId: '520bb632-a02a-415e-9857-93b2ecbf7d60',
    userHandle: 'pshah_manager',
    projectId: 21,
    startDate: '2020-08-16',
    endDate: '2020-08-22',
    daysWorked: 2,
    memberRate: null,
    customerRate: null,
    paymentStatus: 'pending',
    createdBy: '00000000-0000-0000-0000-000000000000',
    updatedBy: null,
    createdAt: '2021-04-10T22:25:08.289Z',
    updatedAt: '2021-04-10T22:25:08.289Z'
  }, {
    id: 'b18398fe-09d0-4671-95b9-a4f56e6c6879',
    resourceBookingId: '520bb632-a02a-415e-9857-93b2ecbf7d60',
    userHandle: 'pshah_manager',
    projectId: 21,
    startDate: '2020-08-23',
    endDate: '2020-08-29',
    daysWorked: 5,
    memberRate: null,
    customerRate: null,
    paymentStatus: 'completed',
    createdBy: '00000000-0000-0000-0000-000000000000',
    updatedBy: null,
    createdAt: '2021-04-10T22:25:08.289Z',
    updatedAt: '2021-04-10T22:25:08.289Z'
  }, {
    id: '89f89450-201c-42e3-a868-a87177b82584',
    resourceBookingId: '520bb632-a02a-415e-9857-93b2ecbf7d60',
    userHandle: 'pshah_manager',
    projectId: 21,
    startDate: '2020-08-30',
    endDate: '2020-09-05',
    daysWorked: 5,
    memberRate: null,
    customerRate: null,
    paymentStatus: 'partially-completed',
    createdBy: '00000000-0000-0000-0000-000000000000',
    updatedBy: null,
    createdAt: '2021-04-10T22:25:08.289Z',
    updatedAt: '2021-04-10T22:25:08.289Z'
  }, {
    id: '3907e916-efdc-49d3-b0ef-970ccf7d78b0',
    resourceBookingId: '520bb632-a02a-415e-9857-93b2ecbf7d60',
    userHandle: 'pshah_manager',
    projectId: 21,
    startDate: '2020-09-06',
    endDate: '2020-09-12',
    daysWorked: 4,
    memberRate: null,
    customerRate: null,
    paymentStatus: 'pending',
    createdBy: '00000000-0000-0000-0000-000000000000',
    updatedBy: null,
    createdAt: '2021-04-10T22:25:08.289Z',
    updatedAt: '2021-04-10T22:25:08.289Z'
  }],
  updateRequest4: {
    startDate: '2020-08-25T04:17:23.131Z',
    endDate: '2020-09-05T04:17:23.131Z'
  },
  updateResponse4: {
    dataValues: {
      id: '520bb632-a02a-415e-9857-93b2ecbf7d60',
      projectId: 21,
      userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
      jobId: '6093e58c-683d-4022-8482-5515e8345016',
      startDate: new Date('2020-08-25T04:17:23.131Z'),
      endDate: new Date('2020-09-05T04:17:23.131Z'),
      memberRate: 13.23,
      customerRate: 13,
      rateType: 'hourly',
      createdAt: '2020-10-09T04:24:01.048Z',
      createdBy: '57646ff9-1cd3-4d3c-88ba-eb09a395366c',
      updatedBy: '00000000-0000-0000-0000-000000000000',
      status: 'sourcing'
    }
  },
  workPeriodUpdateRequests4: [{
    daysWorked: 4
  }, '10faf505-d0e3-4d13-a817-7f1319625e91', '3907e916-efdc-49d3-b0ef-970ccf7d78b0'],
  updateRequest5: {
    startDate: '2020-08-24T04:17:23.131Z',
    endDate: '2020-08-29T04:17:23.131Z'
  },
  updateRequest6: {
    status: 'cancelled'
  }
}
resourceBookingUpdate.response.toJSON = function () {
  return resourceBookingUpdate.response.dataValues
}
resourceBookingUpdate.updateResponse.toJSON = function () {
  return resourceBookingUpdate.updateResponse.dataValues
}
resourceBookingUpdate.response.update = function () {
  return resourceBookingUpdate.updateResponse
}
resourceBookingUpdate.response2.toJSON = function () {
  return resourceBookingUpdate.response2.dataValues
}
resourceBookingUpdate.updateResponse2.toJSON = function () {
  return resourceBookingUpdate.updateResponse2.dataValues
}
resourceBookingUpdate.response2.update = function () {
  return resourceBookingUpdate.updateResponse2
}
resourceBookingUpdate.response3.toJSON = function () {
  return resourceBookingUpdate.response3.dataValues
}
resourceBookingUpdate.updateResponse3.toJSON = function () {
  return resourceBookingUpdate.updateResponse3.dataValues
}
resourceBookingUpdate.response3.update = function () {
  return resourceBookingUpdate.updateResponse3
}
resourceBookingUpdate.response3.destroy = function () {

}
resourceBookingUpdate.response4.toJSON = function () {
  return resourceBookingUpdate.response4.dataValues
}
resourceBookingUpdate.updateResponse4.toJSON = function () {
  return resourceBookingUpdate.updateResponse4.dataValues
}
resourceBookingUpdate.response4.update = function () {
  return resourceBookingUpdate.updateResponse4
}

const workPeriodPayment01 = {
  request: {
    workPeriodId: '467b4df7-ced4-41b9-9710-b83808cddaf4',
    amount: 600,
    status: 'completed'
  },
  response: {
    workPeriodId: '467b4df7-ced4-41b9-9710-b83808cddaf4',
    amount: 600,
    status: 'completed',
    id: '01971e6f-0f09-4a2a-bc2e-2adac0f00622',
    challengeId: '00000000-0000-0000-0000-000000000000',
    createdBy: '57646ff9-1cd3-4d3c-88ba-eb09a395366c',
    updatedAt: '2021-04-21T12:58:07.535Z',
    createdAt: '2021-04-21T12:58:07.535Z',
    updatedBy: null
  },
  ensureWorkPeriodByIdResponse: {
    projectId: 111,
    userHandle: 'pshah_manager',
    endDate: '2021-03-13'
  },
  createPaymentResponse: {
    id: 'c65f0cbf-b197-423d-91cc-db6e3bad9075'
  }
}

workPeriodPayment01.response.toJSON = function () {
  return workPeriodPayment01.response
}

module.exports = {
  currentUser,
  UserTCConnCopilot,
  resourceBooking5Week,
  resourceBooking1Week,
  resourceBookingUpdate,
  workPeriodPayment01
}
