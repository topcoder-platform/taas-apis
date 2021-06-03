const workPeriodPayment01 = {
  request: {
    workPeriodId: '467b4df7-ced4-41b9-9710-b83808cddaf4',
    amount: 600
  },
  response: {
    dataValues: {
      workPeriodId: '467b4df7-ced4-41b9-9710-b83808cddaf4',
      amount: 600,
      status: 'scheduled',
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
    projectId: 111,
    userHandle: 'pshah_manager',
    endDate: '2021-03-13'
  },
  ensureResourceBookingByIdResponse: {
    billingAccountId: 68800079
  },
  ensureResourceBookingByIdResponse02: {},
  createPaymentResponse: {
    id: 'c65f0cbf-b197-423d-91cc-db6e3bad9075'
  }
}

workPeriodPayment01.response.toJSON = function () {
  return workPeriodPayment01.response
}

module.exports = {
  workPeriodPayment01
}
