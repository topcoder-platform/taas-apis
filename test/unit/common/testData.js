const bookingManagerUser = {
  roles: [
    'Topcoder User',
    'copilot',
    'Connect Manager',
    'bookingmanager'
  ],
  iss: 'https://api.topcoder.com',
  handle: 'pshah_manager',
  exp: 55530199259,
  userId: '40152856',
  iat: 1602136970,
  email: 'vikas.agarwal+pshah_manager@topcoder.com',
  jti: '83a7b1cd-15b7-4529-b3a1-7c2282bbc750',
  isBookingManager: true,
  jwtToken: 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6WyJUb3Bjb2RlciBVc2VyIiwiY29waWxvdCIsIkNvbm5lY3QgTWFuYWdlciIsImJvb2tpbmdtYW5hZ2VyIl0sImlzcyI6Imh0dHBzOi8vYXBpLnRvcGNvZGVyLmNvbSIsImhhbmRsZSI6InBzaGFoX21hbmFnZXIiLCJleHAiOjU1NTMwMTk5MjU5LCJ1c2VySWQiOiI0MDE1Mjg1NiIsImlhdCI6MTYwMjEzNjk3MCwiZW1haWwiOiJ2aWthcy5hZ2Fyd2FsK3BzaGFoX21hbmFnZXJAdG9wY29kZXIuY29tIiwianRpIjoiODNhN2IxY2QtMTViNy00NTI5LWIzYTEtN2MyMjgyYmJjNzUwIn0.KlFs8zg059p0P6YLikR5adJSI0trLrPyvQavoaUuOAU'
}

const connectUser = {
  roles: [
    'Connect User'
  ],
  iss: 'https://api.topcoder.com',
  sub: 'connect_user',
  exp: 55530199259,
  userId: '35267983',
  iat: 1602136970,
  email: 'connectUser@topcoder.com',
  jti: '83a7b1cd-15b7-4529-b3a1-7c2282bbc750',
  isBookingManager: false,
  jwtToken: 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6WyJDb25uZWN0IFVzZXIiXSwiaXNzIjoiaHR0cHM6Ly9hcGkudG9wY29kZXIuY29tIiwic3ViIjoiY29ubmVjdF91c2VyIiwiZXhwIjo1NTUzMDE5OTI1OSwidXNlcklkIjoiMzUyNjc5ODMiLCJpYXQiOjE2MDIxMzY5NzAsImVtYWlsIjoiY29ubmVjdFVzZXJAdG9wY29kZXIuY29tIiwianRpIjoiODNhN2IxY2QtMTViNy00NTI5LWIzYTEtN2MyMjgyYmJjNzUwIn0.-rtF-_QhU-jDbxBqs79AP_4xFKp_gfVtptcuOmI7RUM'
}

const topCoderUser = {
  roles: [
    'Topcoder User'
  ],
  iss: 'https://api.topcoder.com',
  handle: 'topcoder_user',
  exp: 55530199259,
  userId: '35267983',
  iat: 1602136970,
  email: 'topcoderUser@topcoder.com',
  jti: '83a7b1cd-15b7-4529-b3a1-7c2282bbc750',
  isBookingManager: false,
  jwtToken: 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6WyJUb3Bjb2RlciBVc2VyIl0sImlzcyI6Imh0dHBzOi8vYXBpLnRvcGNvZGVyLmNvbSIsImhhbmRsZSI6InRvcGNvZGVyX3VzZXIiLCJleHAiOjU1NTMwMTk5MjU5LCJ1c2VySWQiOiIzNTI2Nzk4MyIsImlhdCI6MTYwMjEzNjk3MCwiZW1haWwiOiJ0b3Bjb2RlclVzZXJAdG9wY29kZXIuY29tIiwianRpIjoiODNhN2IxY2QtMTViNy00NTI5LWIzYTEtN2MyMjgyYmJjNzUwIiwiaXNCb29raW5nTWFuYWdlciI6ZmFsc2V9.In0nxYIKEGR3QtQrKhmgHFKjzsBjEdNxdLSj6U2zxRk'
}

const jobRequestBody = {
  projectId: 21,
  externalId: '1212',
  description: 'Dummy Description',
  startDate: '2020-09-27T04:17:23.131Z',
  endDate: '2020-09-27T04:17:23.131Z',
  numPositions: 13,
  resourceType: 'Dummy Resource Type',
  rateType: 'hourly',
  skills: [
    '56fdc405-eccc-4189-9e83-c78abf844f50',
    'f91ae184-aba2-4485-a8cb-9336988c05ab',
    'edfc7b4f-636f-44bd-96fc-949ffc58e38b',
    '4ca63bb6-f515-4ab0-a6bc-c2d8531e084f',
    'ee03c041-d53b-4c08-b7d9-80d7461da3e4'
  ]
}

const jobResponseBody = {
  dataValues: {
    id: '36762910-4efa-4db4-9b2a-c9ab54c232ed',
    projectId: 21,
    externalId: '1212',
    description: 'Dummy Description',
    startDate: '2020-09-27T04:17:23.131Z',
    endDate: '2020-09-27T04:17:23.131Z',
    numPositions: 13,
    resourceType: 'Dummy Resource Type',
    rateType: 'hourly',
    skills: [
      '56fdc405-eccc-4189-9e83-c78abf844f50',
      'f91ae184-aba2-4485-a8cb-9336988c05ab',
      'edfc7b4f-636f-44bd-96fc-949ffc58e38b',
      '4ca63bb6-f515-4ab0-a6bc-c2d8531e084f',
      'ee03c041-d53b-4c08-b7d9-80d7461da3e4'
    ],
    status: 'sourcing',
    createdAt: '2020-10-08T12:58:28.321Z',
    createdBy: 'pshah_manager',
    candidates: [
      {
        id: '5d09b0fb-5164-4b8c-9d04-525e840741e9',
        jobId: '36762910-4efa-4db4-9b2a-c9ab54c232ed',
        userId: 1212,
        status: 'open',
        createdAt: '2020-10-08T12:59:16.426Z',
        createdBy: 'pshah_manager'
      }
    ]
  }
}

const fullyUpdateJobRequestBody = {
  projectId: 21,
  externalId: '1212',
  description: 'Dummy Description',
  startDate: '2020-09-27T04:17:23.131Z',
  endDate: '2020-09-27T04:17:23.131Z',
  numPositions: 13,
  resourceType: 'Dummy Resource Type',
  rateType: 'hourly',
  skills: [
    '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    'cc41ddc4-cacc-4570-9bdb-1229c12b9784'
  ],
  status: 'sourcing'
}

const partiallyUpdateJobRequestBody = {
  description: 'Dummy Description',
  startDate: '2020-09-27T04:17:23.131Z',
  endDate: '2020-09-27T04:17:23.131Z',
  numPositions: 13,
  resourceType: 'Dummy Resource Type',
  rateType: 'hourly',
  skills: [
    '3fa85f64-5717-4562-b3fc-2c963f66afa6'
  ],
  status: 'sourcing'
}

const jobCandidateRequestBody = {
  jobId: jobResponseBody.dataValues.id,
  userId: 1212
}

const jobCandidateResponseBody = {
  dataValues: {
    id: '6e69b20f-144e-4edd-b68e-bd21f37f4b3e',
    jobId: '6093e58c-683d-4022-8482-5515e8345016',
    userId: 35267983,
    createdAt: '2020-10-09T00:51:38.663Z',
    createdBy: 'pshah_manager',
    status: 'open'
  }
}

const fullyUpdateJobCandidateRequestBody = {
  jobId: jobResponseBody.dataValues.id,
  userId: 35267983,
  status: 'selected'
}

const partiallyUpdateJobCandidateRequestBody = {
  status: 'shortlist'
}

const resourceBookingRequestBody = {
  projectId: 21,
  userId: 1212,
  jobId: jobResponseBody.dataValues.id,
  startDate: '2020-09-27T04:17:23.131Z',
  endDate: '2020-09-27T04:17:23.131Z',
  memberRate: 13.23,
  customerRate: 13,
  rateType: 'hourly'
}

const resourceBookingResponseBody = {
  dataValues: {
    id: '520bb632-a02a-415e-9857-93b2ecbf7d60',
    projectId: 21,
    userId: 1212,
    jobId: '6093e58c-683d-4022-8482-5515e8345016',
    startDate: '2020-09-27T04:17:23.131Z',
    endDate: '2020-09-27T04:17:23.131Z',
    memberRate: 13.23,
    customerRate: 13,
    rateType: 'hourly',
    createdAt: '2020-10-09T04:24:01.048Z',
    createdBy: 'pshah_manager',
    status: 'sourcing'
  }
}

const fullyUpdateResourceBookingRequestBody = {
  projectId: 21,
  userId: 1212,
  jobId: resourceBookingResponseBody.dataValues.jobId,
  startDate: '2020-09-27T04:17:23.131Z',
  endDate: '2020-09-27T04:17:23.131Z',
  memberRate: 13.23,
  customerRate: 13,
  rateType: 'hourly',
  status: 'assigned'
}

const partiallyUpdateResourceBookingRequestBody = {
  status: 'assigned',
  startDate: '2020-09-27T04:17:23.131Z',
  endDate: '2020-09-27T04:17:23.131Z',
  memberRate: 13.23,
  customerRate: 13,
  rateType: 'hourly'
}

const unexpected = () => { throw new Error('should not reach here') }

module.exports = {
  bookingManagerUser,
  connectUser,
  topCoderUser,
  jobRequestBody,
  jobResponseBody,
  fullyUpdateJobRequestBody,
  partiallyUpdateJobRequestBody,
  jobCandidateRequestBody,
  jobCandidateResponseBody,
  fullyUpdateJobCandidateRequestBody,
  partiallyUpdateJobCandidateRequestBody,
  resourceBookingRequestBody,
  resourceBookingResponseBody,
  fullyUpdateResourceBookingRequestBody,
  partiallyUpdateResourceBookingRequestBody,
  unexpected
}
