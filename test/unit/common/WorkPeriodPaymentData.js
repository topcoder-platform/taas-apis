const workPeriodPayment01 = {
  request: {
    workPeriodId: '467b4df7-ced4-41b9-9710-b83808cddaf4'
  },
  response: {
    dataValues: {
      workPeriodId: '467b4df7-ced4-41b9-9710-b83808cddaf4',
      amount: 600,
      status: 'scheduled',
      days: 3,
      memberRate: 13.23,
      customerRate: 13,
      id: '01971e6f-0f09-4a2a-bc2e-2adac0f00622',
      challengeId: '00000000-0000-0000-0000-000000000000',
      createdBy: '57646ff9-1cd3-4d3c-88ba-eb09a395366c',
      updatedAt: '2021-04-21T12:58:07.535Z',
      createdAt: '2021-04-21T12:58:07.535Z',
      updatedBy: null
    }
  },
  getUserIdResponse: '79a39efd-91af-494a-b0f6-62310495effd',
  ensureWorkPeriodByIdResponse: {
    userHandle: 'pshah_manager',
    updatedBy: null,
    endDate: '2020-10-31',
    daysPaid: 2,
    resourceBookingId: '8694a939-45fe-482e-bee2-3b530acf4139',
    daysWorked: 5,
    createdAt: '2021-06-13T18:21:52.564Z',
    createdBy: '00000000-0000-0000-0000-000000000000',
    paymentTotal: 5.29,
    id: '467b4df7-ced4-41b9-9710-b83808cddaf4',
    projectId: 17234,
    startDate: '2020-10-25',
    paymentStatus: 'partially-completed',
    updatedAt: '2021-06-13T18:25:08.492Z'
  },
  workPeriodWithPayments: {
    userHandle: 'pshah_manager',
    updatedBy: null,
    endDate: '2020-10-31',
    daysPaid: 5,
    resourceBookingId: '8694a939-45fe-482e-bee2-3b530acf4139',
    daysWorked: 5,
    createdAt: '2021-06-13T18:21:52.564Z',
    createdBy: '00000000-0000-0000-0000-000000000000',
    paymentTotal: 5.29,
    id: '467b4df7-ced4-41b9-9710-b83808cddaf4',
    projectId: 17234,
    startDate: '2020-10-25',
    paymentStatus: 'in-progress',
    updatedAt: '2021-06-13T18:25:08.492Z',
    payments: [
      {
        amount: 5.29,
        updatedBy: null,
        billingAccountId: 80000071,
        workPeriodId: '467b4df7-ced4-41b9-9710-b83808cddaf4',
        createdAt: '2021-06-13T18:22:10.258Z',
        challengeId: '00000000-0000-0000-0000-000000000000',
        memberRate: 13.23,
        createdBy: '57646ff9-1cd3-4d3c-88ba-eb09a395366c',
        customerRate: 13,
        days: 2,
        statusDetails: null,
        id: '2a30b5a1-3558-4795-b516-d03cb098fc0f',
        status: 'completed',
        updatedAt: '2021-06-13T18:25:08.445Z'
      },
      {
        amount: 7.31,
        updatedBy: null,
        billingAccountId: 80000071,
        workPeriodId: '467b4df7-ced4-41b9-9710-b83808cddaf4',
        createdAt: '2021-06-13T18:22:10.258Z',
        challengeId: '00000000-0000-0000-0000-000000000000',
        memberRate: 13.23,
        createdBy: '57646ff9-1cd3-4d3c-88ba-eb09a395366c',
        customerRate: 13,
        days: 3,
        statusDetails: null,
        id: '2a30b5a1-3558-4795-b516-d03cb098fc0f',
        status: 'scheduled',
        updatedAt: '2021-06-13T18:25:08.445Z'
      }
    ]
  },
  ensureResourceBookingByIdResponse: {
    updatedBy: null,
    endDate: '2020-10-27',
    billingAccountId: 80000071,
    userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
    jobId: '13c1fcd2-7bbb-4623-8643-ef025dac4c88',
    rateType: 'hourly',
    createdAt: '2021-06-13T18:21:48.474Z',
    memberRate: 13.23,
    createdBy: '57646ff9-1cd3-4d3c-88ba-eb09a395366c',
    customerRate: 13,
    id: '8694a939-45fe-482e-bee2-3b530acf4139',
    projectId: 17234,
    startDate: '2020-09-27',
    status: 'placed',
    updatedAt: '2021-06-13T18:21:48.474Z'
  },
  workPeriodUpdateResponse: {
    userHandle: 'pshah_manager',
    updatedBy: null,
    endDate: '2020-10-31',
    daysPaid: 5,
    resourceBookingId: '8694a939-45fe-482e-bee2-3b530acf4139',
    daysWorked: 5,
    createdAt: '2021-06-13T18:21:52.564Z',
    createdBy: '00000000-0000-0000-0000-000000000000',
    paymentTotal: 12.6,
    id: '467b4df7-ced4-41b9-9710-b83808cddaf4',
    projectId: 17234,
    startDate: '2020-10-25',
    paymentStatus: 'in-progress',
    updatedAt: '2021-06-13T18:25:08.492Z'
  },
  workPeriodUpdateRequest: {
    daysPaid: 5,
    paymentTotal: 12.6,
    paymentStatus: 'in-progress'
  },
  ensureResourceBookingByIdResponse02: {
    updatedBy: null,
    endDate: '2020-10-27',
    billingAccountId: null,
    userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
    jobId: '13c1fcd2-7bbb-4623-8643-ef025dac4c88',
    rateType: 'hourly',
    createdAt: '2021-06-13T18:21:48.474Z',
    memberRate: 13.23,
    createdBy: '57646ff9-1cd3-4d3c-88ba-eb09a395366c',
    customerRate: 13,
    id: '8694a939-45fe-482e-bee2-3b530acf4139',
    projectId: 17234,
    startDate: '2020-09-27',
    status: 'placed',
    updatedAt: '2021-06-13T18:21:48.474Z'
  },
  createPaymentResponse: {
    id: 'c65f0cbf-b197-423d-91cc-db6e3bad9075'
  }
}

workPeriodPayment01.response.toJSON = function () {
  return workPeriodPayment01.response.dataValues
}
workPeriodPayment01.ensureWorkPeriodByIdResponse.toJSON = function () {
  return workPeriodPayment01.ensureWorkPeriodByIdResponse
}
workPeriodPayment01.ensureResourceBookingByIdResponse.toJSON = function () {
  return workPeriodPayment01.ensureResourceBookingByIdResponse
}
workPeriodPayment01.workPeriodWithPayments.toJSON = function () {
  return workPeriodPayment01.workPeriodWithPayments
}
workPeriodPayment01.workPeriodWithPayments.update = function () {}
workPeriodPayment01.workPeriodUpdateResponse.toJSON = function () {
  return workPeriodPayment01.workPeriodUpdateResponse
}
workPeriodPayment01.ensureResourceBookingByIdResponse02.toJSON = function () {
  return workPeriodPayment01.ensureResourceBookingByIdResponse02
}
module.exports = {
  workPeriodPayment01
}
