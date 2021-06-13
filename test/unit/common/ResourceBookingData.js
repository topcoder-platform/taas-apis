const T01 = {
  resourceBooking: {
    request: {
      projectId: 21,
      userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
      jobId: '36762910-4efa-4db4-9b2a-c9ab54c232ed',
      startDate: '2021-04-03',
      endDate: '2021-05-02',
      memberRate: 13.23,
      customerRate: 13,
      rateType: 'hourly',
      billingAccountId: 68800079
    },
    response: {
      dataValues: {
        id: '520bb632-a02a-415e-9857-93b2ecbf7d60',
        projectId: 21,
        userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
        jobId: '6093e58c-683d-4022-8482-5515e8345016',
        startDate: '2021-04-03',
        endDate: '2021-05-02',
        memberRate: 13.23,
        customerRate: 13,
        rateType: 'hourly',
        createdAt: '2020-10-09T04:24:01.048Z',
        createdBy: '57646ff9-1cd3-4d3c-88ba-eb09a395366c',
        status: 'sourcing',
        billingAccountId: 68800079
      }
    }
  },
  workPeriod: {
    request: [{
      resourceBookingId: '520bb632-a02a-415e-9857-93b2ecbf7d60',
      startDate: '2021-03-28',
      endDate: '2021-04-03',
      daysWorked: 0,
      paymentStatus: 'noDays'
    },
    {
      resourceBookingId: '520bb632-a02a-415e-9857-93b2ecbf7d60',
      startDate: '2021-04-04',
      endDate: '2021-04-10',
      daysWorked: 5,
      paymentStatus: 'pending'
    },
    {
      resourceBookingId: '520bb632-a02a-415e-9857-93b2ecbf7d60',
      startDate: '2021-04-11',
      endDate: '2021-04-17',
      daysWorked: 5,
      paymentStatus: 'pending'
    },
    {
      resourceBookingId: '520bb632-a02a-415e-9857-93b2ecbf7d60',
      startDate: '2021-04-18',
      endDate: '2021-04-24',
      daysWorked: 5,
      paymentStatus: 'pending'
    },
    {
      resourceBookingId: '520bb632-a02a-415e-9857-93b2ecbf7d60',
      startDate: '2021-04-25',
      endDate: '2021-05-01',
      daysWorked: 5,
      paymentStatus: 'pending'
    },
    {
      resourceBookingId: '520bb632-a02a-415e-9857-93b2ecbf7d60',
      startDate: '2021-05-02',
      endDate: '2021-05-08',
      daysWorked: 0,
      paymentStatus: 'noDays'
    }]
  }
}
T01.resourceBooking.response.toJSON = () => T01.resourceBooking.response.dataValues
const T02 = {
  resourceBooking: {
    request: {
      projectId: 21,
      userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
      jobId: '36762910-4efa-4db4-9b2a-c9ab54c232ed',
      startDate: '2021-04-11',
      endDate: '2021-04-17',
      memberRate: 13.23,
      customerRate: 13,
      rateType: 'hourly',
      billingAccountId: 68800079
    },
    response: {
      dataValues: {
        id: '520bb632-a02a-415e-9857-93b2ecbf7d60',
        projectId: 21,
        userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
        jobId: '6093e58c-683d-4022-8482-5515e8345016',
        startDate: '2021-04-11',
        endDate: '2021-04-17',
        memberRate: 13.23,
        customerRate: 13,
        rateType: 'hourly',
        createdAt: '2020-10-09T04:24:01.048Z',
        createdBy: '57646ff9-1cd3-4d3c-88ba-eb09a395366c',
        status: 'sourcing',
        billingAccountId: 68800079
      }
    }
  },
  workPeriod: {
    request: [{
      resourceBookingId: '520bb632-a02a-415e-9857-93b2ecbf7d60',
      startDate: '2021-04-11',
      endDate: '2021-04-17',
      daysWorked: 5,
      paymentStatus: 'pending'
    }]
  }
}
T02.resourceBooking.response.toJSON = () => T02.resourceBooking.response.dataValues
const T03 = {
  resourceBooking: {
    request: {
      projectId: 21,
      userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
      jobId: '36762910-4efa-4db4-9b2a-c9ab54c232ed',
      endDate: '2021-04-17',
      memberRate: 13.23,
      customerRate: 13,
      rateType: 'hourly',
      billingAccountId: 68800079
    },
    response: {
      dataValues: {
        id: '520bb632-a02a-415e-9857-93b2ecbf7d60',
        projectId: 21,
        userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
        jobId: '6093e58c-683d-4022-8482-5515e8345016',
        startDate: null,
        endDate: '2021-04-17',
        memberRate: 13.23,
        customerRate: 13,
        rateType: 'hourly',
        createdAt: '2020-10-09T04:24:01.048Z',
        createdBy: '57646ff9-1cd3-4d3c-88ba-eb09a395366c',
        status: 'sourcing',
        billingAccountId: 68800079
      }
    }
  }
}
T03.resourceBooking.response.toJSON = () => T03.resourceBooking.response.dataValues
const T04 = {
  resourceBooking: {
    request: {
      projectId: 21,
      userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
      jobId: '36762910-4efa-4db4-9b2a-c9ab54c232ed',
      startDate: '2021-04-17',
      memberRate: 13.23,
      customerRate: 13,
      rateType: 'hourly',
      billingAccountId: 68800079
    },
    response: {
      dataValues: {
        id: '520bb632-a02a-415e-9857-93b2ecbf7d60',
        projectId: 21,
        userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
        jobId: '6093e58c-683d-4022-8482-5515e8345016',
        startDate: '2021-04-17',
        endDate: null,
        memberRate: 13.23,
        customerRate: 13,
        rateType: 'hourly',
        createdAt: '2020-10-09T04:24:01.048Z',
        createdBy: '57646ff9-1cd3-4d3c-88ba-eb09a395366c',
        status: 'sourcing',
        billingAccountId: 68800079
      }
    }
  }
}
T04.resourceBooking.response.toJSON = () => T04.resourceBooking.response.dataValues
const T05 = {
  resourceBooking: {
    request: {
      projectId: 21,
      userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
      jobId: '36762910-4efa-4db4-9b2a-c9ab54c232ed',
      startDate: '2021-04-17',
      endDate: '2021-04-16',
      memberRate: 13.23,
      customerRate: 13,
      rateType: 'hourly',
      billingAccountId: 68800079
    }
  },
  error: {
    message: 'endDate cannot be earlier than startDate'
  }
}
const T06 = {
  resourceBooking: {
    value: {
      dataValues: {
        id: '520bb632-a02a-415e-9857-93b2ecbf7d60',
        projectId: 21,
        userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
        jobId: '6093e58c-683d-4022-8482-5515e8345016',
        startDate: '2021-04-11',
        endDate: '2021-04-17',
        memberRate: 13.23,
        customerRate: 13,
        rateType: 'hourly',
        createdAt: '2020-10-09T04:24:01.048Z',
        createdBy: '57646ff9-1cd3-4d3c-88ba-eb09a395366c',
        status: 'sourcing',
        billingAccountId: 68800079
      }
    },
    request: {
      startDate: '2021-04-13',
      endDate: '2021-04-15'
    },
    response: {
      dataValues: {
        id: '520bb632-a02a-415e-9857-93b2ecbf7d60',
        projectId: 21,
        userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
        jobId: '6093e58c-683d-4022-8482-5515e8345016',
        startDate: '2021-04-13',
        endDate: '2021-04-15',
        memberRate: 13.23,
        customerRate: 13,
        rateType: 'hourly',
        createdAt: '2020-10-09T04:24:01.048Z',
        createdBy: '57646ff9-1cd3-4d3c-88ba-eb09a395366c',
        status: 'sourcing',
        billingAccountId: 68800079
      }
    }
  },
  workPeriod: {
    response: [{
      dataValues: {
        id: '10faf505-d0e3-4d13-a817-7f1319625e91',
        resourceBookingId: '520bb632-a02a-415e-9857-93b2ecbf7d60',
        userHandle: 'pshah_manager',
        projectId: 21,
        startDate: '2021-04-11',
        endDate: '2021-04-17',
        daysWorked: 5,
        daysPaid: 0,
        paymentTotal: 0,
        paymentStatus: 'pending',
        createdBy: '00000000-0000-0000-0000-000000000000',
        updatedBy: null,
        createdAt: '2021-04-10T22:25:08.289Z',
        updatedAt: '2021-04-10T22:25:08.289Z'
      },
      toJSON: () => T06.workPeriod.response[0].dataValues
    }],
    request: [
      {
        id: '10faf505-d0e3-4d13-a817-7f1319625e91',
        data: { daysWorked: 3 }
      }
    ]
  }
}
T06.resourceBooking.value.toJSON = () => T06.resourceBooking.value.dataValues
T06.resourceBooking.value.update = () => T06.resourceBooking.response
T06.resourceBooking.response.toJSON = () => T06.resourceBooking.response.dataValues
const T07 = {
  resourceBooking: {
    value: {
      dataValues: {
        id: '520bb632-a02a-415e-9857-93b2ecbf7d60',
        projectId: 21,
        userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
        jobId: '6093e58c-683d-4022-8482-5515e8345016',
        startDate: '2021-04-11',
        endDate: '2021-04-17',
        memberRate: 13.23,
        customerRate: 13,
        rateType: 'hourly',
        createdAt: '2020-10-09T04:24:01.048Z',
        createdBy: '57646ff9-1cd3-4d3c-88ba-eb09a395366c',
        status: 'sourcing',
        billingAccountId: 68800079
      }
    },
    request: {
      startDate: '2021-04-10',
      endDate: '2021-04-15'
    },
    response: {
      dataValues: {
        id: '520bb632-a02a-415e-9857-93b2ecbf7d60',
        projectId: 21,
        userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
        jobId: '6093e58c-683d-4022-8482-5515e8345016',
        startDate: '2021-04-10',
        endDate: '2021-04-15',
        memberRate: 13.23,
        customerRate: 13,
        rateType: 'hourly',
        createdAt: '2020-10-09T04:24:01.048Z',
        createdBy: '57646ff9-1cd3-4d3c-88ba-eb09a395366c',
        status: 'sourcing',
        billingAccountId: 68800079
      }
    }
  },
  workPeriod: {
    response: [{
      dataValues: {
        id: '10faf505-d0e3-4d13-a817-7f1319625e91',
        resourceBookingId: '520bb632-a02a-415e-9857-93b2ecbf7d60',
        userHandle: 'pshah_manager',
        projectId: 21,
        startDate: '2021-04-11',
        endDate: '2021-04-17',
        daysWorked: 5,
        daysPaid: 0,
        paymentTotal: 0,
        paymentStatus: 'pending',
        createdBy: '00000000-0000-0000-0000-000000000000',
        updatedBy: null,
        createdAt: '2021-04-10T22:25:08.289Z',
        updatedAt: '2021-04-10T22:25:08.289Z'
      },
      toJSON: () => T07.workPeriod.response[0].dataValues
    }],
    request: [
      {
        data: {
          resourceBookingId: '520bb632-a02a-415e-9857-93b2ecbf7d60',
          startDate: '2021-04-04',
          endDate: '2021-04-10',
          daysWorked: 0,
          paymentStatus: 'noDays'
        }
      },
      {
        id: '10faf505-d0e3-4d13-a817-7f1319625e91',
        data: {
          daysWorked: 4
        }
      }
    ]
  }
}
T07.resourceBooking.value.toJSON = () => T07.resourceBooking.value.dataValues
T07.resourceBooking.value.update = () => T07.resourceBooking.response
T07.resourceBooking.response.toJSON = () => T07.resourceBooking.response.dataValues
const T08 = {
  resourceBooking: {
    value: {
      dataValues: {
        id: '520bb632-a02a-415e-9857-93b2ecbf7d60',
        projectId: 21,
        userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
        jobId: '6093e58c-683d-4022-8482-5515e8345016',
        startDate: '2021-04-11',
        endDate: '2021-04-17',
        memberRate: 13.23,
        customerRate: 13,
        rateType: 'hourly',
        createdAt: '2020-10-09T04:24:01.048Z',
        createdBy: '57646ff9-1cd3-4d3c-88ba-eb09a395366c',
        status: 'sourcing',
        billingAccountId: 68800079
      }
    },
    request: {
      startDate: '2021-04-12',
      endDate: '2021-04-18'
    },
    response: {
      dataValues: {
        id: '520bb632-a02a-415e-9857-93b2ecbf7d60',
        projectId: 21,
        userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
        jobId: '6093e58c-683d-4022-8482-5515e8345016',
        startDate: '2021-04-12',
        endDate: '2021-04-18',
        memberRate: 13.23,
        customerRate: 13,
        rateType: 'hourly',
        createdAt: '2020-10-09T04:24:01.048Z',
        createdBy: '57646ff9-1cd3-4d3c-88ba-eb09a395366c',
        status: 'sourcing',
        billingAccountId: 68800079
      }
    }
  },
  workPeriod: {
    response: [{
      dataValues: {
        id: '10faf505-d0e3-4d13-a817-7f1319625e91',
        resourceBookingId: '520bb632-a02a-415e-9857-93b2ecbf7d60',
        userHandle: 'pshah_manager',
        projectId: 21,
        startDate: '2021-04-11',
        endDate: '2021-04-17',
        daysWorked: 5,
        daysPaid: 0,
        paymentTotal: 0,
        paymentStatus: 'pending',
        createdBy: '00000000-0000-0000-0000-000000000000',
        updatedBy: null,
        createdAt: '2021-04-10T22:25:08.289Z',
        updatedAt: '2021-04-10T22:25:08.289Z'
      },
      toJSON: () => T08.workPeriod.response[0].dataValues
    }],
    request: [
      {
        data: {
          resourceBookingId: '520bb632-a02a-415e-9857-93b2ecbf7d60',
          startDate: '2021-04-18',
          endDate: '2021-04-24',
          daysWorked: 0,
          paymentStatus: 'noDays'
        }
      }
    ]
  }
}
T08.resourceBooking.value.toJSON = () => T08.resourceBooking.value.dataValues
T08.resourceBooking.value.update = () => T08.resourceBooking.response
T08.resourceBooking.response.toJSON = () => T08.resourceBooking.response.dataValues
const T09 = {
  resourceBooking: {
    value: {
      dataValues: {
        id: '520bb632-a02a-415e-9857-93b2ecbf7d60',
        projectId: 21,
        userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
        jobId: '6093e58c-683d-4022-8482-5515e8345016',
        startDate: '2021-04-10',
        endDate: '2021-04-17',
        memberRate: 13.23,
        customerRate: 13,
        rateType: 'hourly',
        createdAt: '2020-10-09T04:24:01.048Z',
        createdBy: '57646ff9-1cd3-4d3c-88ba-eb09a395366c',
        status: 'sourcing',
        billingAccountId: 68800079
      }
    },
    request: {
      startDate: '2021-04-11',
      endDate: '2021-04-15'
    },
    response: {
      dataValues: {
        id: '520bb632-a02a-415e-9857-93b2ecbf7d60',
        projectId: 21,
        userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
        jobId: '6093e58c-683d-4022-8482-5515e8345016',
        startDate: '2021-04-11',
        endDate: '2021-04-15',
        memberRate: 13.23,
        customerRate: 13,
        rateType: 'hourly',
        createdAt: '2020-10-09T04:24:01.048Z',
        createdBy: '57646ff9-1cd3-4d3c-88ba-eb09a395366c',
        status: 'sourcing',
        billingAccountId: 68800079
      }
    }
  },
  workPeriod: {
    response: [{
      dataValues: {
        id: '10faf505-d0e3-4d13-a817-7f1319625e90',
        resourceBookingId: '520bb632-a02a-415e-9857-93b2ecbf7d60',
        userHandle: 'pshah_manager',
        projectId: 21,
        startDate: '2021-04-04',
        endDate: '2021-04-10',
        daysWorked: 0,
        daysPaid: 0,
        paymentTotal: 0,
        paymentStatus: 'noDays',
        createdBy: '00000000-0000-0000-0000-000000000000',
        updatedBy: null,
        createdAt: '2021-04-10T22:25:08.289Z',
        updatedAt: '2021-04-10T22:25:08.289Z'
      },
      toJSON: () => T09.workPeriod.response[0].dataValues
    }, {
      dataValues: {
        id: '10faf505-d0e3-4d13-a817-7f1319625e91',
        resourceBookingId: '520bb632-a02a-415e-9857-93b2ecbf7d60',
        userHandle: 'pshah_manager',
        projectId: 21,
        startDate: '2021-04-11',
        endDate: '2021-04-17',
        daysWorked: 5,
        daysPaid: 0,
        paymentTotal: 0,
        paymentStatus: 'pending',
        createdBy: '00000000-0000-0000-0000-000000000000',
        updatedBy: null,
        createdAt: '2021-04-10T22:25:08.289Z',
        updatedAt: '2021-04-10T22:25:08.289Z'
      },
      toJSON: () => T09.workPeriod.response[1].dataValues
    }],
    request: [
      {
        id: '10faf505-d0e3-4d13-a817-7f1319625e90'
      },
      {
        id: '10faf505-d0e3-4d13-a817-7f1319625e91',
        data: {
          daysWorked: 4
        }
      }
    ]
  }
}
T09.resourceBooking.value.toJSON = () => T09.resourceBooking.value.dataValues
T09.resourceBooking.value.update = () => T09.resourceBooking.response
T09.resourceBooking.response.toJSON = () => T09.resourceBooking.response.dataValues
const T10 = {
  resourceBooking: {
    value: {
      dataValues: {
        id: '520bb632-a02a-415e-9857-93b2ecbf7d60',
        projectId: 21,
        userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
        jobId: '6093e58c-683d-4022-8482-5515e8345016',
        startDate: '2021-04-10',
        endDate: '2021-04-17',
        memberRate: 13.23,
        customerRate: 13,
        rateType: 'hourly',
        createdAt: '2020-10-09T04:24:01.048Z',
        createdBy: '57646ff9-1cd3-4d3c-88ba-eb09a395366c',
        status: 'sourcing',
        billingAccountId: 68800079
      }
    },
    request: {
      startDate: '2021-04-08',
      endDate: '2021-04-10'
    },
    response: {
      dataValues: {
        id: '520bb632-a02a-415e-9857-93b2ecbf7d60',
        projectId: 21,
        userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
        jobId: '6093e58c-683d-4022-8482-5515e8345016',
        startDate: '2021-04-08',
        endDate: '2021-04-10',
        memberRate: 13.23,
        customerRate: 13,
        rateType: 'hourly',
        createdAt: '2020-10-09T04:24:01.048Z',
        createdBy: '57646ff9-1cd3-4d3c-88ba-eb09a395366c',
        status: 'sourcing',
        billingAccountId: 68800079
      }
    }
  },
  workPeriod: {
    response: [{
      dataValues: {
        id: '10faf505-d0e3-4d13-a817-7f1319625e90',
        resourceBookingId: '520bb632-a02a-415e-9857-93b2ecbf7d60',
        userHandle: 'pshah_manager',
        projectId: 21,
        startDate: '2021-04-04',
        endDate: '2021-04-10',
        daysWorked: 0,
        daysPaid: 0,
        paymentTotal: 0,
        paymentStatus: 'noDays',
        createdBy: '00000000-0000-0000-0000-000000000000',
        updatedBy: null,
        createdAt: '2021-04-10T22:25:08.289Z',
        updatedAt: '2021-04-10T22:25:08.289Z'
      },
      toJSON: () => T10.workPeriod.response[0].dataValues
    }, {
      dataValues: {
        id: '10faf505-d0e3-4d13-a817-7f1319625e91',
        resourceBookingId: '520bb632-a02a-415e-9857-93b2ecbf7d60',
        userHandle: 'pshah_manager',
        projectId: 21,
        startDate: '2021-04-11',
        endDate: '2021-04-17',
        daysWorked: 5,
        daysPaid: 0,
        paymentTotal: 0,
        paymentStatus: 'pending',
        createdBy: '00000000-0000-0000-0000-000000000000',
        updatedBy: null,
        createdAt: '2021-04-10T22:25:08.289Z',
        updatedAt: '2021-04-10T22:25:08.289Z'
      },
      toJSON: () => T10.workPeriod.response[1].dataValues
    }],
    request: [
      {
        id: '10faf505-d0e3-4d13-a817-7f1319625e91'
      },
      {
        id: '10faf505-d0e3-4d13-a817-7f1319625e90',
        data: {
          daysWorked: 2
        }
      }
    ]
  }
}
T10.resourceBooking.value.toJSON = () => T10.resourceBooking.value.dataValues
T10.resourceBooking.value.update = () => T10.resourceBooking.response
T10.resourceBooking.response.toJSON = () => T10.resourceBooking.response.dataValues
const T11 = {
  resourceBooking: {
    value: {
      dataValues: {
        id: '520bb632-a02a-415e-9857-93b2ecbf7d60',
        projectId: 21,
        userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
        jobId: '6093e58c-683d-4022-8482-5515e8345016',
        startDate: '2021-04-10',
        endDate: '2021-04-17',
        memberRate: 13.23,
        customerRate: 13,
        rateType: 'hourly',
        createdAt: '2020-10-09T04:24:01.048Z',
        createdBy: '57646ff9-1cd3-4d3c-88ba-eb09a395366c',
        status: 'sourcing',
        billingAccountId: 68800079
      }
    },
    request: {
      startDate: '2021-04-08',
      endDate: '2021-04-13'
    },
    response: {
      dataValues: {
        id: '520bb632-a02a-415e-9857-93b2ecbf7d60',
        projectId: 21,
        userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
        jobId: '6093e58c-683d-4022-8482-5515e8345016',
        startDate: '2021-04-08',
        endDate: '2021-04-13',
        memberRate: 13.23,
        customerRate: 13,
        rateType: 'hourly',
        createdAt: '2020-10-09T04:24:01.048Z',
        createdBy: '57646ff9-1cd3-4d3c-88ba-eb09a395366c',
        status: 'sourcing',
        billingAccountId: 68800079
      }
    }
  },
  workPeriod: {
    response: [{
      dataValues: {
        id: '10faf505-d0e3-4d13-a817-7f1319625e90',
        resourceBookingId: '520bb632-a02a-415e-9857-93b2ecbf7d60',
        userHandle: 'pshah_manager',
        projectId: 21,
        startDate: '2021-04-04',
        endDate: '2021-04-10',
        daysWorked: 0,
        daysPaid: 0,
        paymentTotal: 0,
        paymentStatus: 'noDays',
        createdBy: '00000000-0000-0000-0000-000000000000',
        updatedBy: null,
        createdAt: '2021-04-10T22:25:08.289Z',
        updatedAt: '2021-04-10T22:25:08.289Z'
      },
      toJSON: () => T11.workPeriod.response[0].dataValues
    }, {
      dataValues: {
        id: '10faf505-d0e3-4d13-a817-7f1319625e91',
        resourceBookingId: '520bb632-a02a-415e-9857-93b2ecbf7d60',
        userHandle: 'pshah_manager',
        projectId: 21,
        startDate: '2021-04-11',
        endDate: '2021-04-17',
        daysWorked: 3,
        daysPaid: 0,
        paymentTotal: 0,
        paymentStatus: 'pending',
        createdBy: '00000000-0000-0000-0000-000000000000',
        updatedBy: null,
        createdAt: '2021-04-10T22:25:08.289Z',
        updatedAt: '2021-04-10T22:25:08.289Z'
      },
      toJSON: () => T11.workPeriod.response[1].dataValues
    }],
    request: [
      {
        id: '10faf505-d0e3-4d13-a817-7f1319625e90',
        data: { daysWorked: 2 }
      },
      {
        id: '10faf505-d0e3-4d13-a817-7f1319625e91',
        data: { daysWorked: 2 }
      }
    ]
  }
}
T11.resourceBooking.value.toJSON = () => T11.resourceBooking.value.dataValues
T11.resourceBooking.value.update = () => T11.resourceBooking.response
T11.resourceBooking.response.toJSON = () => T11.resourceBooking.response.dataValues
const T12 = {
  resourceBooking: {
    value: {
      dataValues: {
        id: '520bb632-a02a-415e-9857-93b2ecbf7d60',
        projectId: 21,
        userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
        jobId: '6093e58c-683d-4022-8482-5515e8345016',
        startDate: '2021-04-05',
        endDate: '2021-04-17',
        memberRate: 13.23,
        customerRate: 13,
        rateType: 'hourly',
        createdAt: '2020-10-09T04:24:01.048Z',
        createdBy: '57646ff9-1cd3-4d3c-88ba-eb09a395366c',
        status: 'sourcing',
        billingAccountId: 68800079
      }
    },
    request: {
      startDate: '2021-04-14',
      endDate: '2021-04-24'
    },
    response: {
      dataValues: {
        id: '520bb632-a02a-415e-9857-93b2ecbf7d60',
        projectId: 21,
        userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
        jobId: '6093e58c-683d-4022-8482-5515e8345016',
        startDate: '2021-04-14',
        endDate: '2021-04-24',
        memberRate: 13.23,
        customerRate: 13,
        rateType: 'hourly',
        createdAt: '2020-10-09T04:24:01.048Z',
        createdBy: '57646ff9-1cd3-4d3c-88ba-eb09a395366c',
        status: 'sourcing',
        billingAccountId: 68800079
      }
    }
  },
  workPeriod: {
    response: [{
      dataValues: {
        id: '10faf505-d0e3-4d13-a817-7f1319625e90',
        resourceBookingId: '520bb632-a02a-415e-9857-93b2ecbf7d60',
        userHandle: 'pshah_manager',
        projectId: 21,
        startDate: '2021-04-04',
        endDate: '2021-04-10',
        daysWorked: 4,
        daysPaid: 0,
        paymentTotal: 0,
        paymentStatus: 'pending',
        createdBy: '00000000-0000-0000-0000-000000000000',
        updatedBy: null,
        createdAt: '2021-04-10T22:25:08.289Z',
        updatedAt: '2021-04-10T22:25:08.289Z'
      },
      toJSON: () => T12.workPeriod.response[0].dataValues
    }, {
      dataValues: {
        id: '10faf505-d0e3-4d13-a817-7f1319625e91',
        resourceBookingId: '520bb632-a02a-415e-9857-93b2ecbf7d60',
        userHandle: 'pshah_manager',
        projectId: 21,
        startDate: '2021-04-11',
        endDate: '2021-04-17',
        daysWorked: 4,
        daysPaid: 1,
        paymentTotal: 2.65,
        paymentStatus: 'partially-completed',
        createdBy: '00000000-0000-0000-0000-000000000000',
        updatedBy: null,
        createdAt: '2021-04-10T22:25:08.289Z',
        updatedAt: '2021-04-10T22:25:08.289Z'
      },
      toJSON: () => T12.workPeriod.response[1].dataValues
    }],
    request: [
      {
        id: '10faf505-d0e3-4d13-a817-7f1319625e90'
      },
      {
        id: '10faf505-d0e3-4d13-a817-7f1319625e91',
        data: { daysWorked: 3 }
      },
      {
        data: {
          resourceBookingId: '520bb632-a02a-415e-9857-93b2ecbf7d60',
          startDate: '2021-04-18',
          endDate: '2021-04-24',
          daysWorked: 5,
          paymentStatus: 'pending'
        }
      }
    ]
  }
}
T12.resourceBooking.value.toJSON = () => T12.resourceBooking.value.dataValues
T12.resourceBooking.value.update = () => T12.resourceBooking.response
T12.resourceBooking.response.toJSON = () => T12.resourceBooking.response.dataValues
const T13 = {
  resourceBooking: {
    value: {
      dataValues: {
        id: '520bb632-a02a-415e-9857-93b2ecbf7d60',
        projectId: 21,
        userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
        jobId: '6093e58c-683d-4022-8482-5515e8345016',
        startDate: '2021-04-05',
        endDate: '2021-04-17',
        memberRate: 13.23,
        customerRate: 13,
        rateType: 'hourly',
        createdAt: '2020-10-09T04:24:01.048Z',
        createdBy: '57646ff9-1cd3-4d3c-88ba-eb09a395366c',
        status: 'sourcing',
        billingAccountId: 68800079
      }
    },
    request: {
      status: 'cancelled'
    }
  },
  error: {
    httpStatus: 400,
    message: `WorkPeriods with id of 10faf505-d0e3-4d13-a817-7f1319625e91
        has completed, partially-completed or in-progress payment status.`
  },
  workPeriod: {
    response: [{
      dataValues: {
        id: '10faf505-d0e3-4d13-a817-7f1319625e90',
        resourceBookingId: '520bb632-a02a-415e-9857-93b2ecbf7d60',
        userHandle: 'pshah_manager',
        projectId: 21,
        startDate: '2021-04-04',
        endDate: '2021-04-10',
        daysWorked: 4,
        daysPaid: 0,
        paymentTotal: 0,
        paymentStatus: 'pending',
        createdBy: '00000000-0000-0000-0000-000000000000',
        updatedBy: null,
        createdAt: '2021-04-10T22:25:08.289Z',
        updatedAt: '2021-04-10T22:25:08.289Z'
      },
      toJSON: () => T13.workPeriod.response[0].dataValues
    }, {
      dataValues: {
        id: '10faf505-d0e3-4d13-a817-7f1319625e91',
        resourceBookingId: '520bb632-a02a-415e-9857-93b2ecbf7d60',
        userHandle: 'pshah_manager',
        projectId: 21,
        startDate: '2021-04-11',
        endDate: '2021-04-17',
        daysWorked: 4,
        daysPaid: 4,
        paymentTotal: 10.59,
        paymentStatus: 'completed',
        createdBy: '00000000-0000-0000-0000-000000000000',
        updatedBy: null,
        createdAt: '2021-04-10T22:25:08.289Z',
        updatedAt: '2021-04-10T22:25:08.289Z'
      },
      toJSON: () => T13.workPeriod.response[1].dataValues
    }]
  }
}
T13.resourceBooking.value.toJSON = () => T13.resourceBooking.value.dataValues
const T14 = {
  resourceBooking: {
    value: {
      dataValues: {
        id: '520bb632-a02a-415e-9857-93b2ecbf7d60',
        projectId: 21,
        userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
        jobId: '6093e58c-683d-4022-8482-5515e8345016',
        startDate: '2021-04-05',
        endDate: '2021-04-17',
        memberRate: 13.23,
        customerRate: 13,
        rateType: 'hourly',
        createdAt: '2020-10-09T04:24:01.048Z',
        createdBy: '57646ff9-1cd3-4d3c-88ba-eb09a395366c',
        status: 'sourcing',
        billingAccountId: 68800079
      }
    },
    request: {
      startDate: '2021-04-05',
      endDate: '2021-04-10'
    }
  },
  error: {
    httpStatus: 400,
    message: `WorkPeriods with id of 10faf505-d0e3-4d13-a817-7f1319625e91
        has completed, partially-completed or in-progress payment status.`
  },
  workPeriod: {
    response: [{
      dataValues: {
        id: '10faf505-d0e3-4d13-a817-7f1319625e90',
        resourceBookingId: '520bb632-a02a-415e-9857-93b2ecbf7d60',
        userHandle: 'pshah_manager',
        projectId: 21,
        startDate: '2021-04-04',
        endDate: '2021-04-10',
        daysWorked: 4,
        daysPaid: 0,
        paymentTotal: 0,
        paymentStatus: 'pending',
        createdBy: '00000000-0000-0000-0000-000000000000',
        updatedBy: null,
        createdAt: '2021-04-10T22:25:08.289Z',
        updatedAt: '2021-04-10T22:25:08.289Z'
      },
      toJSON: () => T14.workPeriod.response[0].dataValues
    }, {
      dataValues: {
        id: '10faf505-d0e3-4d13-a817-7f1319625e91',
        resourceBookingId: '520bb632-a02a-415e-9857-93b2ecbf7d60',
        userHandle: 'pshah_manager',
        projectId: 21,
        startDate: '2021-04-11',
        endDate: '2021-04-17',
        daysWorked: 4,
        daysPaid: 4,
        paymentTotal: 10.59,
        paymentStatus: 'completed',
        createdBy: '00000000-0000-0000-0000-000000000000',
        updatedBy: null,
        createdAt: '2021-04-10T22:25:08.289Z',
        updatedAt: '2021-04-10T22:25:08.289Z'
      },
      toJSON: () => T14.workPeriod.response[1].dataValues
    }]
  }
}
T14.resourceBooking.value.toJSON = () => T14.resourceBooking.value.dataValues
const T15 = {
  resourceBooking: {
    value: {
      dataValues: {
        id: '520bb632-a02a-415e-9857-93b2ecbf7d60',
        projectId: 21,
        userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
        jobId: '6093e58c-683d-4022-8482-5515e8345016',
        startDate: '2021-04-05',
        endDate: '2021-04-17',
        memberRate: 13.23,
        customerRate: 13,
        rateType: 'hourly',
        createdAt: '2020-10-09T04:24:01.048Z',
        createdBy: '57646ff9-1cd3-4d3c-88ba-eb09a395366c',
        status: 'sourcing',
        billingAccountId: 68800079
      }
    }
  },
  workPeriod: {
    response: [{
      dataValues: {
        id: '10faf505-d0e3-4d13-a817-7f1319625e90',
        resourceBookingId: '520bb632-a02a-415e-9857-93b2ecbf7d60',
        userHandle: 'pshah_manager',
        projectId: 21,
        startDate: '2021-04-04',
        endDate: '2021-04-10',
        daysWorked: 4,
        daysPaid: 0,
        paymentTotal: 0,
        paymentStatus: 'pending',
        createdBy: '00000000-0000-0000-0000-000000000000',
        updatedBy: null,
        createdAt: '2021-04-10T22:25:08.289Z',
        updatedAt: '2021-04-10T22:25:08.289Z'
      },
      toJSON: () => T15.workPeriod.response[0].dataValues
    }, {
      dataValues: {
        id: '10faf505-d0e3-4d13-a817-7f1319625e91',
        resourceBookingId: '520bb632-a02a-415e-9857-93b2ecbf7d60',
        userHandle: 'pshah_manager',
        projectId: 21,
        startDate: '2021-04-11',
        endDate: '2021-04-17',
        daysWorked: 4,
        daysPaid: 0,
        paymentTotal: 0,
        paymentStatus: 'pending',
        createdBy: '00000000-0000-0000-0000-000000000000',
        updatedBy: null,
        createdAt: '2021-04-10T22:25:08.289Z',
        updatedAt: '2021-04-10T22:25:08.289Z'
      },
      toJSON: () => T15.workPeriod.response[1].dataValues
    }],
    request: [
      {
        id: '10faf505-d0e3-4d13-a817-7f1319625e90'
      },
      {
        id: '10faf505-d0e3-4d13-a817-7f1319625e91'
      }
    ]
  }
}
T15.resourceBooking.value.toJSON = () => T15.resourceBooking.value.dataValues
T15.resourceBooking.value.destroy = () => undefined
const T16 = {
  resourceBooking: {
    value: {
      dataValues: {
        id: '520bb632-a02a-415e-9857-93b2ecbf7d60',
        projectId: 21,
        userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
        jobId: '6093e58c-683d-4022-8482-5515e8345016',
        startDate: '2021-04-05',
        endDate: '2021-04-17',
        memberRate: 13.23,
        customerRate: 13,
        rateType: 'hourly',
        createdAt: '2020-10-09T04:24:01.048Z',
        createdBy: '57646ff9-1cd3-4d3c-88ba-eb09a395366c',
        status: 'sourcing',
        billingAccountId: 68800079
      }
    }
  },
  error: {
    httpStatus: 400,
    message: `WorkPeriods with id of 10faf505-d0e3-4d13-a817-7f1319625e91
        has completed, partially-completed or in-progress payment status.`
  },
  workPeriod: {
    response: [{
      dataValues: {
        id: '10faf505-d0e3-4d13-a817-7f1319625e90',
        resourceBookingId: '520bb632-a02a-415e-9857-93b2ecbf7d60',
        userHandle: 'pshah_manager',
        projectId: 21,
        startDate: '2021-04-04',
        endDate: '2021-04-10',
        daysWorked: 4,
        daysPaid: 0,
        paymentTotal: 0,
        paymentStatus: 'pending',
        createdBy: '00000000-0000-0000-0000-000000000000',
        updatedBy: null,
        createdAt: '2021-04-10T22:25:08.289Z',
        updatedAt: '2021-04-10T22:25:08.289Z'
      },
      toJSON: () => T16.workPeriod.response[0].dataValues
    }, {
      dataValues: {
        id: '10faf505-d0e3-4d13-a817-7f1319625e91',
        resourceBookingId: '520bb632-a02a-415e-9857-93b2ecbf7d60',
        userHandle: 'pshah_manager',
        projectId: 21,
        startDate: '2021-04-11',
        endDate: '2021-04-17',
        daysWorked: 4,
        daysPaid: 4,
        paymentTotal: 10.59,
        paymentStatus: 'completed',
        createdBy: '00000000-0000-0000-0000-000000000000',
        updatedBy: null,
        createdAt: '2021-04-10T22:25:08.289Z',
        updatedAt: '2021-04-10T22:25:08.289Z'
      },
      toJSON: () => T16.workPeriod.response[1].dataValues
    }]
  }
}
T16.resourceBooking.value.toJSON = () => T16.resourceBooking.value.dataValues
const T17 = {
  esClientGet: {
    body: {
      _source: {
        updatedBy: null,
        endDate: '2020-10-27',
        billingAccountId: 80000071,
        userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
        jobId: '05232809-3693-44c1-a0cc-9a79f2672385',
        rateType: 'hourly',
        createdAt: '2021-05-08T18:47:37.268Z',
        memberRate: 13.23,
        createdBy: '57646ff9-1cd3-4d3c-88ba-eb09a395366c',
        customerRate: 13,
        id: '60e99790-8da0-4596-badc-29a06feb78a0',
        projectId: 17234,
        startDate: '2020-09-27',
        status: 'placed',
        updatedAt: '2021-05-08T18:47:37.268Z'
      }
    }
  },
  criteria: {}
}
const T18 = {
  resourceBooking: {
    value: {
      dataValues: {
        id: '520bb632-a02a-415e-9857-93b2ecbf7d60',
        projectId: 21,
        userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
        jobId: '6093e58c-683d-4022-8482-5515e8345016',
        startDate: '2021-04-05',
        endDate: '2021-04-17',
        memberRate: 13.23,
        customerRate: 13,
        rateType: 'hourly',
        createdAt: '2020-10-09T04:24:01.048Z',
        createdBy: '57646ff9-1cd3-4d3c-88ba-eb09a395366c',
        status: 'sourcing',
        billingAccountId: 68800079
      }
    }
  },
  criteria: { fromDb: true }
}
const T19 = {
  id: '520bb632-a02a-415e-9857-93b2ecbf7d60',
  criteria: {
    fields: 'other'
  },
  error: {
    httpStatus: 400,
    message: 'other are not allowed'
  }
}
const T20 = {
  id: '520bb632-a02a-415e-9857-93b2ecbf7d60',
  criteria: {
    fields: 'memberRate'
  },
  error: {
    httpStatus: 403,
    message: 'You don\'t have access to view memberRate and paymentTotal'
  }
}
const T21 = {
  id: '520bb632-a02a-415e-9857-93b2ecbf7d60',
  criteria: {
    fields: 'workPeriods'
  },
  error: {
    httpStatus: 403,
    message: 'You don\'t have access to view workPeriods'
  }
}
const T22 = {
  id: '520bb632-a02a-415e-9857-93b2ecbf7d60',
  criteria: {
    fields: 'id'
  },
  error: {
    httpStatus: 403,
    message: 'Not allowed without including "projectId"'
  }
}
const T23 = {
  id: '520bb632-a02a-415e-9857-93b2ecbf7d60',
  criteria: {},
  esClientGet: {
    body: {
      _source: {
        updatedBy: null,
        endDate: '2020-10-27',
        billingAccountId: 80000071,
        userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
        jobId: '05232809-3693-44c1-a0cc-9a79f2672385',
        rateType: 'hourly',
        createdAt: '2021-05-08T18:47:37.268Z',
        memberRate: 13.23,
        createdBy: '57646ff9-1cd3-4d3c-88ba-eb09a395366c',
        customerRate: 13,
        id: '520bb632-a02a-415e-9857-93b2ecbf7d60',
        projectId: 111,
        startDate: '2020-09-27',
        status: 'placed',
        updatedAt: '2021-05-08T18:47:37.268Z'
      }
    }
  },
  error: {
    httpStatus: 401,
    message: 'userId: 222 the user is not a member of project 111'
  }
}
const T24 = {
  esClientSearch: {
    body: {
      hits: {
        total: {
          value: 2
        },
        hits: [
          {
            _source: {
              updatedBy: null,
              endDate: '2020-10-27',
              billingAccountId: 80000071,
              userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
              jobId: '05232809-3693-44c1-a0cc-9a79f2672385',
              rateType: 'hourly',
              createdAt: '2021-05-08T18:35:16.368Z',
              memberRate: 13.23,
              createdBy: '57646ff9-1cd3-4d3c-88ba-eb09a395366c',
              customerRate: 13,
              id: 'fbe133dd-0e36-4d0c-8197-49307b13ce75',
              projectId: 17234,
              startDate: '2020-09-27',
              status: 'placed',
              updatedAt: '2021-05-08T18:35:16.368Z'
            }
          },
          {
            _source: {
              updatedBy: null,
              endDate: '2020-10-27',
              billingAccountId: 80000071,
              userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
              jobId: '05232809-3693-44c1-a0cc-9a79f2672385',
              rateType: 'hourly',
              createdAt: '2021-05-08T18:47:37.268Z',
              memberRate: 13.23,
              createdBy: '57646ff9-1cd3-4d3c-88ba-eb09a395366c',
              customerRate: 13,
              id: '60e99790-8da0-4596-badc-29a06feb78a0',
              projectId: 17234,
              startDate: '2020-09-27',
              status: 'placed',
              updatedAt: '2021-05-08T18:47:37.268Z'
            }
          }
        ]
      }
    }
  },
  criteria: {},
  result: {
    total: 2,
    page: 1,
    perPage: 20,
    result: [
      {
        updatedBy: null,
        endDate: '2020-10-27',
        billingAccountId: 80000071,
        userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
        jobId: '05232809-3693-44c1-a0cc-9a79f2672385',
        rateType: 'hourly',
        createdAt: '2021-05-08T18:35:16.368Z',
        memberRate: 13.23,
        createdBy: '57646ff9-1cd3-4d3c-88ba-eb09a395366c',
        customerRate: 13,
        id: 'fbe133dd-0e36-4d0c-8197-49307b13ce75',
        projectId: 17234,
        startDate: '2020-09-27',
        status: 'placed',
        updatedAt: '2021-05-08T18:35:16.368Z'
      },
      {
        updatedBy: null,
        endDate: '2020-10-27',
        billingAccountId: 80000071,
        userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
        jobId: '05232809-3693-44c1-a0cc-9a79f2672385',
        rateType: 'hourly',
        createdAt: '2021-05-08T18:47:37.268Z',
        memberRate: 13.23,
        createdBy: '57646ff9-1cd3-4d3c-88ba-eb09a395366c',
        customerRate: 13,
        id: '60e99790-8da0-4596-badc-29a06feb78a0',
        projectId: 17234,
        startDate: '2020-09-27',
        status: 'placed',
        updatedAt: '2021-05-08T18:47:37.268Z'
      }
    ]
  }
}
const T25 = {
  resourceBookingFindAll: [
    {
      updatedBy: null,
      endDate: '2020-10-27',
      billingAccountId: 80000071,
      userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
      jobId: '05232809-3693-44c1-a0cc-9a79f2672385',
      rateType: 'hourly',
      createdAt: '2021-05-08T18:35:16.368Z',
      memberRate: 13.23,
      createdBy: '57646ff9-1cd3-4d3c-88ba-eb09a395366c',
      customerRate: 13,
      id: 'fbe133dd-0e36-4d0c-8197-49307b13ce75',
      projectId: 17234,
      startDate: '2020-09-27',
      status: 'placed',
      updatedAt: '2021-05-08T18:35:16.368Z'
    },
    {
      updatedBy: null,
      endDate: '2020-10-27',
      billingAccountId: 80000071,
      userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
      jobId: '05232809-3693-44c1-a0cc-9a79f2672385',
      rateType: 'hourly',
      createdAt: '2021-05-08T18:47:37.268Z',
      memberRate: 13.23,
      createdBy: '57646ff9-1cd3-4d3c-88ba-eb09a395366c',
      customerRate: 13,
      id: '60e99790-8da0-4596-badc-29a06feb78a0',
      projectId: 17234,
      startDate: '2020-09-27',
      status: 'placed',
      updatedAt: '2021-05-08T18:47:37.268Z'
    }
  ],
  resourceBookingCount: [{ id: 'fbe133dd-0e36-4d0c-8197-49307b13ce75', count: 1 },
    { id: '60e99790-8da0-4596-badc-29a06feb78a0', count: 1 }],
  criteria: {},
  result: {
    fromDb: true,
    total: 2,
    page: 1,
    perPage: 20,
    result: [
      {
        updatedBy: null,
        endDate: '2020-10-27',
        billingAccountId: 80000071,
        userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
        jobId: '05232809-3693-44c1-a0cc-9a79f2672385',
        rateType: 'hourly',
        createdAt: '2021-05-08T18:35:16.368Z',
        memberRate: 13.23,
        createdBy: '57646ff9-1cd3-4d3c-88ba-eb09a395366c',
        customerRate: 13,
        id: 'fbe133dd-0e36-4d0c-8197-49307b13ce75',
        projectId: 17234,
        startDate: '2020-09-27',
        status: 'placed',
        updatedAt: '2021-05-08T18:35:16.368Z'
      },
      {
        updatedBy: null,
        endDate: '2020-10-27',
        billingAccountId: 80000071,
        userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
        jobId: '05232809-3693-44c1-a0cc-9a79f2672385',
        rateType: 'hourly',
        createdAt: '2021-05-08T18:47:37.268Z',
        memberRate: 13.23,
        createdBy: '57646ff9-1cd3-4d3c-88ba-eb09a395366c',
        customerRate: 13,
        id: '60e99790-8da0-4596-badc-29a06feb78a0',
        projectId: 17234,
        startDate: '2020-09-27',
        status: 'placed',
        updatedAt: '2021-05-08T18:47:37.268Z'
      }
    ]
  }
}
const T26 = {
  criteria: {
    fields: 'other'
  },
  error: {
    httpStatus: 400,
    message: 'other are not allowed'
  }
}
const T27 = {
  criteria: {
    fields: 'memberRate'
  },
  error: {
    httpStatus: 403,
    message: 'You don\'t have access to view memberRate and paymentTotal'
  }
}
const T28 = {
  criteria: {
    fields: 'workPeriods'
  },
  error: {
    httpStatus: 403,
    message: 'You don\'t have access to view workPeriods'
  }
}
const T29 = {
  criteria: {},
  error: {
    httpStatus: 403,
    message: 'Not allowed without filtering by "projectId"'
  }
}
const T30 = {
  criteria: { projectId: 111 },
  error: {
    httpStatus: 401,
    message: 'userId: 222 the user is not a member of project 111'
  }
}
const T31 = {
  criteria: { 'workPeriods.startDate': '2021-05-10' },
  error: {
    httpStatus: 400,
    message: 'Can not filter or sort by some field which is not included in fields'
  }
}
const T32 = {
  criteria: { sortBy: 'workPeriods.daysWorked' },
  error: {
    httpStatus: 400,
    message: 'Can not filter or sort by some field which is not included in fields'
  }
}
const T33 = {
  criteria: { fields: 'workPeriods', sortBy: 'workPeriods.daysWorked' },
  error: {
    httpStatus: 400,
    message: 'Can not sort by workPeriod field without filtering by workPeriods.startDate or workPeriods.endDate'
  }
}
const T34 = {
  criteria: { fields: 'id,startDate,endDate,workPeriods', status: 'closed' },
  error: {
    httpStatus: 400,
    message: 'Can not filter or sort by some field which is not included in fields'
  }
}
const T35 = {
  criteria: { fields: 'id,startDate,endDate', 'workPeriods.paymentStatus': 'completed' },
  error: {
    httpStatus: 400,
    message: 'Can not filter or sort by some field which is not included in fields'
  }
}
const T36 = {
  resourceBooking: {
    value: {
      dataValues: {
        id: '520bb632-a02a-415e-9857-93b2ecbf7d60',
        projectId: 21,
        userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
        jobId: '6093e58c-683d-4022-8482-5515e8345016',
        startDate: '2021-04-05',
        endDate: '2021-04-17',
        memberRate: 13.23,
        customerRate: 13,
        rateType: 'hourly',
        createdAt: '2020-10-09T04:24:01.048Z',
        createdBy: '57646ff9-1cd3-4d3c-88ba-eb09a395366c',
        status: 'sourcing',
        billingAccountId: 68800079
      }
    },
    request: {
      startDate: '2021-04-05',
      endDate: null
    }
  },
  error: {
    httpStatus: 400,
    message: 'You cannot remove start or end date if both are already set for Resource Booking.'
  }
}
T36.resourceBooking.value.toJSON = () => T36.resourceBooking.value.dataValues
const T37 = {
  resourceBooking: {
    value: {
      dataValues: {
        id: '520bb632-a02a-415e-9857-93b2ecbf7d60',
        projectId: 21,
        userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
        jobId: '6093e58c-683d-4022-8482-5515e8345016',
        startDate: null,
        endDate: '2021-04-17',
        memberRate: 13.23,
        customerRate: 13,
        rateType: 'hourly',
        createdAt: '2020-10-09T04:24:01.048Z',
        createdBy: '57646ff9-1cd3-4d3c-88ba-eb09a395366c',
        status: 'sourcing',
        billingAccountId: 68800079
      }
    },
    request: {
      startDate: null,
      endDate: null
    },
    response: {
      dataValues: {
        id: '520bb632-a02a-415e-9857-93b2ecbf7d60',
        projectId: 21,
        userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
        jobId: '6093e58c-683d-4022-8482-5515e8345016',
        startDate: null,
        endDate: null,
        memberRate: 13.23,
        customerRate: 13,
        rateType: 'hourly',
        createdAt: '2020-10-09T04:24:01.048Z',
        createdBy: '57646ff9-1cd3-4d3c-88ba-eb09a395366c',
        status: 'sourcing',
        billingAccountId: 68800079
      }
    }
  },
  workPeriod: {
    response: []
  }
}
T37.resourceBooking.value.toJSON = () => T37.resourceBooking.value.dataValues
T37.resourceBooking.value.update = () => T37.resourceBooking.response
T37.resourceBooking.response.toJSON = () => T37.resourceBooking.response.dataValues
const T38 = {
  resourceBooking: {
    value: {
      dataValues: {
        id: '520bb632-a02a-415e-9857-93b2ecbf7d60',
        projectId: 21,
        userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
        jobId: '6093e58c-683d-4022-8482-5515e8345016',
        startDate: null,
        endDate: null,
        memberRate: 13.23,
        customerRate: 13,
        rateType: 'hourly',
        createdAt: '2020-10-09T04:24:01.048Z',
        createdBy: '57646ff9-1cd3-4d3c-88ba-eb09a395366c',
        status: 'sourcing',
        billingAccountId: 68800079
      }
    },
    request: {
      startDate: null,
      endDate: null
    },
    response: {
      dataValues: {
        id: '520bb632-a02a-415e-9857-93b2ecbf7d60',
        projectId: 21,
        userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
        jobId: '6093e58c-683d-4022-8482-5515e8345016',
        startDate: null,
        endDate: null,
        memberRate: 13.23,
        customerRate: 13,
        rateType: 'hourly',
        createdAt: '2020-10-09T04:24:01.048Z',
        createdBy: '57646ff9-1cd3-4d3c-88ba-eb09a395366c',
        status: 'sourcing',
        billingAccountId: 68800079
      }
    }
  },
  workPeriod: {
    response: []
  }
}
T38.resourceBooking.value.toJSON = () => T38.resourceBooking.value.dataValues
T38.resourceBooking.value.update = () => T38.resourceBooking.response
T38.resourceBooking.response.toJSON = () => T38.resourceBooking.response.dataValues
module.exports = {
  T01,
  T02,
  T03,
  T04,
  T05,
  T06,
  T07,
  T08,
  T09,
  T10,
  T11,
  T12,
  T13,
  T14,
  T15,
  T16,
  T17,
  T18,
  T19,
  T20,
  T21,
  T22,
  T23,
  T24,
  T25,
  T26,
  T27,
  T28,
  T29,
  T30,
  T31,
  T32,
  T33,
  T34,
  T35,
  T36,
  T37,
  T38
}
