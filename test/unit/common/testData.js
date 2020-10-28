
const bookingManagerUser = {
  roles: [
    'Topcoder User',
    'copilot',
    'Connect Manager',
    'bookingmanager',
    'u-bahn'
  ],
  iss: 'https://api.topcoder.com',
  handle: 'pshah_manager',
  exp: 55530199259,
  userId: '40152856',
  iat: 1602136970,
  email: 'vikas.agarwal+pshah_manager@topcoder.com',
  jti: '83a7b1cd-15b7-4529-b3a1-7c2282bbc750',
  isBookingManager: true,
  jwtToken: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ik5VSkZORGd4UlRVME5EWTBOVVkzTlRkR05qTXlRamxETmpOQk5UYzVRVUV3UlRFeU56TTJRUSJ9.eyJodHRwczovL3RvcGNvZGVyLWRldi5jb20vcm9sZXMiOlsiVG9wY29kZXIgVXNlciIsImNvcGlsb3QiLCJDb25uZWN0IE1hbmFnZXIiLCJib29raW5nbWFuYWdlciIsInUtYmFobiJdLCJodHRwczovL3RvcGNvZGVyLWRldi5jb20vdXNlcklkIjoiNDAxNTI4NTYiLCJodHRwczovL3RvcGNvZGVyLWRldi5jb20vaGFuZGxlIjoicHNoYWhfbWFuYWdlciIsImh0dHBzOi8vdG9wY29kZXItZGV2LmNvbS91c2VyX2lkIjoiYXV0aDB8NDAxNTI4NTYiLCJodHRwczovL3RvcGNvZGVyLWRldi5jb20vdGNzc28iOiI0MDE1Mjg1Nnw4MTM0ZjQ4ZWJlMTFhODQ4YTM3NTllNWVmOWU5MmYyMTQ2OTJlMjExMzA0MGM4MmI1ZDhmNTgxYzZkZmNjYzg4IiwiaHR0cHM6Ly90b3Bjb2Rlci1kZXYuY29tL2FjdGl2ZSI6dHJ1ZSwibmlja25hbWUiOiJwc2hhaF9tYW5hZ2VyIiwibmFtZSI6InZpa2FzLmFnYXJ3YWwrcHNoYWhfbWFuYWdlckB0b3Bjb2Rlci5jb20iLCJwaWN0dXJlIjoiaHR0cHM6Ly9zLmdyYXZhdGFyLmNvbS9hdmF0YXIvOTJhZmIyZjBlZDUyZmRmYWUxZjM3MTAyMWFlNjUwMTM_cz00ODAmcj1wZyZkPWh0dHBzJTNBJTJGJTJGY2RuLmF1dGgwLmNvbSUyRmF2YXRhcnMlMkZ2aS5wbmciLCJ1cGRhdGVkX2F0IjoiMjAyMC0xMC0yNFQwODoyODoyNC4xODRaIiwiZW1haWwiOiJ2aWthcy5hZ2Fyd2FsK3BzaGFoX21hbmFnZXJAdG9wY29kZXIuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImlzcyI6Imh0dHBzOi8vYXV0aC50b3Bjb2Rlci1kZXYuY29tLyIsInN1YiI6ImF1dGgwfDQwMTUyODU2IiwiYXVkIjoiQlhXWFVXbmlsVlVQZE4wMXQyU2UyOVR3MlpZTkdadkgiLCJpYXQiOjE2MDM1NDMzMzgsImV4cCI6MzMxNjA0NTI3MzgsIm5vbmNlIjoiUjFBMmN6WXVWVFptYmpaSFJHOTJWbDlEU1VKNlVsbHZRWGMzUkhoNVMzWldkV1pEY0ROWE1FWjFYdz09In0.2gPsqZTgS1rtiNa1USm3KPA6Xsv3TcHxuDFofgIbeOM'
}

const connectUser = {
  roles: [
    'Topcoder User',
    'copilot',
    'Connect Manager',
    'u-bahn'
  ],
  iss: 'https://api.topcoder.com',
  sub: 'connect_user',
  exp: 55530199259,
  userId: '8547899',
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
  userId: '8547899',
  iat: 1602136970,
  email: 'topcoderUser@topcoder.com',
  jti: '83a7b1cd-15b7-4529-b3a1-7c2282bbc750',
  isBookingManager: false,
  jwtToken: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ik5VSkZORGd4UlRVME5EWTBOVVkzTlRkR05qTXlRamxETmpOQk5UYzVRVUV3UlRFeU56TTJRUSJ9.eyJodHRwczovL3RvcGNvZGVyLWRldi5jb20vcm9sZXMiOlsiVG9wY29kZXIgVXNlciJdLCJodHRwczovL3RvcGNvZGVyLWRldi5jb20vdXNlcklkIjoiODU0Nzg5OSIsImh0dHBzOi8vdG9wY29kZXItZGV2LmNvbS9oYW5kbGUiOiJwc2hhaF9tYW5hZ2VyIiwiaHR0cHM6Ly90b3Bjb2Rlci1kZXYuY29tL3VzZXJfaWQiOiJhdXRoMHw0MDE1Mjg1NiIsImh0dHBzOi8vdG9wY29kZXItZGV2LmNvbS90Y3NzbyI6IjQwMTUyODU2fDgxMzRmNDhlYmUxMWE4NDhhMzc1OWU1ZWY5ZTkyZjIxNDY5MmUyMTEzMDQwYzgyYjVkOGY1ODFjNmRmY2NjODgiLCJodHRwczovL3RvcGNvZGVyLWRldi5jb20vYWN0aXZlIjp0cnVlLCJuaWNrbmFtZSI6InBzaGFoX21hbmFnZXIiLCJuYW1lIjoidmlrYXMuYWdhcndhbCtwc2hhaF9tYW5hZ2VyQHRvcGNvZGVyLmNvbSIsInBpY3R1cmUiOiJodHRwczovL3MuZ3JhdmF0YXIuY29tL2F2YXRhci85MmFmYjJmMGVkNTJmZGZhZTFmMzcxMDIxYWU2NTAxMz9zPTQ4MCZyPXBnJmQ9aHR0cHMlM0ElMkYlMkZjZG4uYXV0aDAuY29tJTJGYXZhdGFycyUyRnZpLnBuZyIsInVwZGF0ZWRfYXQiOiIyMDIwLTEwLTI0VDA4OjI4OjI0LjE4NFoiLCJlbWFpbCI6InZpa2FzLmFnYXJ3YWwrcHNoYWhfbWFuYWdlckB0b3Bjb2Rlci5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaXNzIjoiaHR0cHM6Ly9hdXRoLnRvcGNvZGVyLWRldi5jb20vIiwic3ViIjoiYXV0aDB8NDAxNTI4NTYiLCJhdWQiOiJCWFdYVVduaWxWVVBkTjAxdDJTZTI5VHcyWllOR1p2SCIsImlhdCI6MTYwMzU0MzMzOCwiZXhwIjozMzE2MDQ1MjczOCwibm9uY2UiOiJSMUEyY3pZdVZUWm1ialpIUkc5MlZsOURTVUo2VWxsdlFYYzNSSGg1UzNaV2RXWkRjRE5YTUVaMVh3PT0ifQ.HbAisH30DLcbFNQeIifSzk1yhDmlGHNpPi9LSZbAowo'
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
        userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
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
  userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a'
}

const jobCandidateResponseBody = {
  dataValues: {
    id: '6e69b20f-144e-4edd-b68e-bd21f37f4b3e',
    jobId: '6093e58c-683d-4022-8482-5515e8345016',
    userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
    createdAt: '2020-10-09T00:51:38.663Z',
    createdBy: 'pshah_manager',
    status: 'open'
  }
}

const fullyUpdateJobCandidateRequestBody = {
  jobId: jobResponseBody.dataValues.id,
  userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
  status: 'selected'
}

const partiallyUpdateJobCandidateRequestBody = {
  status: 'shortlist'
}

const resourceBookingRequestBody = {
  projectId: 21,
  userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
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
    userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
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
  userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
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
