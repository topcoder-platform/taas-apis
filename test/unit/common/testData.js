
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

const projectRequestBody = [
  { id: 9050, name: 'sample' },
  { id: 9056, name: 'Invitation Test Max' },
  { id: 9063, name: 'Project001{codejam}' },
  { id: 9072, name: 'Project Name Edited' },
  { id: 9080, name: 'sdfdf' },
  { id: 9081, name: 'Test' },
  { id: 9091, name: 'Test 1 Max' },
  { id: 9096, name: 'test 1' },
  { id: 9097, name: 'test 2' },
  { id: 9099, name: 'Test' },
  { id: 9101, name: 'testin vikasverma' },
  { id: 9102, name: 'Test' },
  { id: 9132, name: 'Copilot Invite Test Max' },
  { id: 9133, name: 'Test' },
  { id: 9138, name: 'Update node versions 5 {codejam}' },
  { id: 9153, name: 'y' },
  { id: 9155, name: 'error' },
  { id: 9157, name: '3950-vikasverma' },
  { id: 9175, name: 'project' },
  { id: 9176, name: 'Testing 4-24-20 at 4-20' }
]

const userRequestBody = [
  {
    id: '1b88e433-828b-4e0d-9fb5-ef75b9dcca6e',
    handle: 'PE335869',
    firstName: ' Peddaram',
    lastName: ' Varalakshmi'
  },
  {
    id: '10803918-ded0-4906-9442-65dc8819de91',
    handle: 'Gayathri_1994',
    firstName: 'Gayathri',
    lastName: 'Sekar'
  },
  {
    id: '5bd69a82-c2cb-476f-9462-0883d3b28b90',
    handle: 'Sandrine_Kuvalis98',
    firstName: 'Mekhi',
    lastName: 'Tremblay'
  },
  {
    id: '460bddcd-3580-4f2a-bfe8-5ba6d8f6f6af',
    handle: 'Lourdes0',
    firstName: 'Larissa',
    lastName: 'Sporer'
  },
  {
    id: '4f2dc463-e24b-4b4a-8cde-c0122fbfb8ac',
    handle: 'Demond39',
    firstName: 'Domenic',
    lastName: 'Casper'
  },
  {
    id: '39203872-707a-41b8-a587-18cab2557632',
    handle: 'testkeychng204',
    firstName: 'Testing',
    lastName: 'Mithun'
  },
  {
    id: 'b074236c-bb33-449f-9320-72437a064c38',
    handle: 'MA40018690',
    firstName: 'Mangasamudram',
    lastName: 'Teja'
  },
  {
    id: 'cdaeb417-e400-4df1-b484-f99ae10b4800',
    handle: 'Leilani_Fahey35',
    firstName: 'Godfrey',
    lastName: 'Morar'
  },
  {
    id: 'ecec4ad8-3a1d-4646-8641-25054e8f2d33',
    handle: 'Bernadine17',
    firstName: 'Elmore',
    lastName: 'Sanford'
  },
  {
    id: '28df7acf-d7b1-467c-8ee5-594c7bace8dc',
    handle: 'Sylvan_Gorczany',
    firstName: 'Samara',
    lastName: 'Schultz'
  },
  {
    id: '6910d2f4-a50a-4494-8f46-6de1f3d032c2',
    handle: 'Aditya65',
    firstName: 'Clemens',
    lastName: 'Rodriguez'
  },
  {
    id: '9bf08a13-29b6-4ef9-a2b6-d967c1c50fb4',
    handle: 'Abirami_S',
    firstName: 'Abirami',
    lastName: 'SenthilNathan'
  },
  {
    id: '25f7b0e8-10a1-4bbc-b2f9-dacb1c72f1e9',
    handle: 'Gaurav..Kumar',
    firstName: 'Gaurav',
    lastName: 'Kumar'
  },
  {
    id: '6fa6d708-68a6-47be-9591-4b5100921b3a',
    handle: 'Kian.DuBuque',
    firstName: 'Myles',
    lastName: 'Connelly'
  },
  {
    id: '8edca7c4-0e71-4688-952a-42227f73ca32',
    handle: 'BinoyVipin',
    firstName: 'Binoy',
    lastName: 'V'
  },
  {
    id: '247aaea8-f7e0-4ac8-b89e-4d78b76226b0',
    handle: 'saikrupa87',
    firstName: 'Miriyala',
    lastName: 'Saikrupa reddy'
  },
  {
    id: 'cc7a694c-44a0-412b-9d1d-f98f7fe26a21',
    handle: 'SriV_1672',
    firstName: 'Srinivas',
    lastName: 'Merugu'
  },
  {
    id: '07744775-eff1-443d-b56b-9d09ed02e599',
    handle: 'Aachal',
    firstName: 'Aachal ',
    lastName: 'Jain'
  },
  {
    id: '0668fe37-b9cf-481b-8769-c3615833f80a',
    handle: 'satadipa',
    firstName: 'Satadipa',
    lastName: 'Datta'
  },
  {
    id: '844fad5d-f19e-444b-be2e-ba9c36d34265',
    handle: 'BA249730',
    firstName: 'Balamurali',
    lastName: 'B'
  }
]

const memberRequestBody = [
  {
    userId: 305384,
    handleLower: 'mess',
    photoURL: 'https://topcoder-dev-media.s3.us-east-1.amazonaws.com/member/profile/mess-1601487458118.jpeg'
  },
  {
    userId: 88773829,
    handleLower: 'pe335869'
  },
  {
    userId: 8547899,
    handleLower: 'tonyj',
    photoURL: 'https://topcoder-dev-media.s3.amazonaws.com/member/profile/TonyJ-1604301092491.jpeg'
  },
  {
    userId: 8547893,
    handleLower: 'gayathri_1994',
    photoURL: 'https://topcoder-dev-media.s3.amazonaws.com/member/profile/TonyJ-1604301092491.jpeg'
  }
]

const skillsRequestBody = [
  { id: 'cb01fd31-e8d2-4e34-8bf3-b149705de3e1', name: 'ACI Concrete Strength Testing Technician' },
  { id: '59ee7b42-f3f3-48c9-bdca-e8396b241793', name: '2D Computer Graphics' },
  { id: '1b585c26-2649-4078-8369-b599fe6a9d75', name: 'ACCP Certified' },
  { id: '8b757998-ff7d-4b3a-9fee-a49d3e41da03', name: '3D Projection' },
  { id: 'bcfc8806-cae6-47ff-b0c9-f604acfc8c99', name: '35 Mm Films' },
  { id: 'db4358f3-c9a3-4afd-94a4-2d352d6bfa60', name: 'Nintex Workflow for SharePoint' },
  { id: '077533be-8029-4585-8b8e-9efc2dc43f53', name: 'CA Service Virtualization' },
  { id: 'f682838c-a9a7-4b47-8c2e-45d5132c04d7', name: 'SOAP UI Testing' },
  { id: '13dda8dc-4c34-4751-bbab-aab76d757cbb', name: 'JavaBean' },
  { id: '99b930b5-1b91-4df1-8b17-d9307107bb51', name: 'Excel' },
  { id: '513ba597-5ad1-4177-8556-35583e0cc6ac', name: 'Microsoft Dynamics 365 Portals' },
  { id: 'ee4c50c1-c8c3-475e-b6b6-edbd136a19d6', name: 'SFDC Lightening Components' },
  { id: '1c67b60d-32a3-4dcd-8bc4-947bc476fcd1', name: 'Performance Point' },
  { id: '70834003-3eba-452c-9bc4-a6d9d637a10e', name: 'AI/ML App Testing' },
  { id: '89139c80-d0a2-47c2-aa16-14589d5afd10', name: 'User Testing' },
  { id: '866ee344-5328-4c1d-b9ae-1c003f8fef16', name: 'DB2 Testing' },
  { id: '9f2d9127-6a2e-4506-ad76-c4ab63577b09', name: 'IndexedDB' },
  { id: 'c854ab55-5922-4be1-8ecc-b3bc1f8629af', name: 'InVision' },
  { id: '9515e7ee-83b6-49d1-ba5c-6c59c5a8ef1b', name: 'List' },
  { id: '57ef43c2-4227-4ea1-bc5a-287321f3f8b2', name: 'Microsoft Dynamics AX 2012 - Retail' }
]

const userSkillsRequestBody = [
  { id: '5d313a7b-795b-42a2-9e7e-dc5e81c2f2b5', name: 'Java' },
  { id: 'cb01fd31-e8d2-4e34-8bf3-b149705de3e1', name: 'ACI Concrete Strength Testing Technician' }
]

const resourceBookingsRequestBody = [
  {
    projectId: 9063,
    userId: '4f2dc463-e24b-4b4a-8cde-c0122fbfb8ac',
    jobId: '1d9e8c1a-e653-4d31-a799-2685e41da216',
    startDate: '2020-09-28T04:17:23.131Z',
    endDate: '2020-12-30T04:17:23.131Z',
    memberRate: 13.23,
    customerRate: 11.11,
    rateType: 'hourly',
    status: 'assigned',
    createdAt: '2020-11-11T04:17:23.131Z',
    createdBy: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
    id: '3d9e8c1a-e653-4d31-a799-2685e41da216'
  },
  {
    projectId: 9056,
    userId: '460bddcd-3580-4f2a-bfe8-5ba6d8f6f6af',
    jobId: '1d9e8c1a-e653-4d31-a799-2685e41da215',
    startDate: '2020-09-28T04:17:23.131Z',
    endDate: '2020-12-30T04:17:23.131Z',
    memberRate: 13.23,
    customerRate: 156.7,
    rateType: 'hourly',
    status: 'assigned',
    createdAt: '2020-11-11T04:17:23.131Z',
    createdBy: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
    id: '3d9e8c1a-e653-4d31-a799-2685e41da215'
  },
  {
    projectId: 9050,
    userId: '5bd69a82-c2cb-476f-9462-0883d3b28b90',
    jobId: '1d9e8c1a-e653-4d31-a799-2685e41da214',
    startDate: '2020-09-28T04:17:23.131Z',
    endDate: '2020-12-30T04:17:23.131Z',
    memberRate: 13.23,
    customerRate: 16.7,
    rateType: 'hourly',
    status: 'assigned',
    createdAt: '2020-11-11T04:17:23.131Z',
    createdBy: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
    id: '3d9e8c1a-e653-4d31-a799-2685e41da214'
  },
  {
    projectId: 9050,
    userId: '10803918-ded0-4906-9442-65dc8819de91',
    jobId: '1d9e8c1a-e653-4d31-a799-2685e41da213',
    startDate: '2020-09-22T04:17:23.131Z',
    endDate: '2020-10-27T04:17:23.131Z',
    memberRate: 13.23,
    customerRate: 14.5,
    rateType: 'hourly',
    status: 'assigned',
    createdAt: '2020-11-11T04:17:23.131Z',
    createdBy: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
    id: '3d9e8c1a-e653-4d31-a799-2685e41da213'
  },
  {
    projectId: 9050,
    userId: '1b88e433-828b-4e0d-9fb5-ef75b9dcca6e',
    jobId: '1d9e8c1a-e653-4d31-a799-2685e41da212',
    startDate: '2020-09-27T04:17:23.131Z',
    endDate: '2021-11-11T04:17:23.131Z',
    memberRate: 13.23,
    customerRate: 13,
    rateType: 'hourly',
    status: 'assigned',
    createdAt: '2020-11-11T04:17:23.131Z',
    createdBy: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
    id: '3d9e8c1a-e653-4d31-a799-2685e41da212'
  }
]

const jobsRequestBody = [
  {
    projectId: 9063,
    externalId: '1212',
    description: 'Dummy Description',
    startDate: '2020-09-27T04:17:23.131Z',
    endDate: '2020-10-09T04:17:23.131Z',
    numPositions: 10,
    resourceType: 'Dummy Resource Type',
    rateType: 'hourly',
    skills: [
      '1b585c26-2649-4078-8369-b599fe6a9d75',
      'bcfc8806-cae6-47ff-b0c9-f604acfc8c99'
    ],
    status: 'sourcing',
    createdAt: '2020-11-11T04:17:23.131Z',
    createdBy: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
    id: '1d9e8c1a-e653-4d31-a799-2685e41da215'
  },
  {
    projectId: 9063,
    externalId: '1212',
    description: 'Dummy Description',
    startDate: '2020-09-17T04:17:23.131Z',
    endDate: '2020-10-19T04:17:23.131Z',
    numPositions: 20,
    resourceType: 'Dummy Resource Type',
    rateType: 'hourly',
    skills: [
      '8b757998-ff7d-4b3a-9fee-a49d3e41da03',
      'bcfc8806-cae6-47ff-b0c9-f604acfc8c99'
    ],
    status: 'sourcing',
    createdAt: '2020-11-11T04:17:23.131Z',
    createdBy: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
    id: '1d9e8c1a-e653-4d31-a799-2685e41da214',
    candidates: [
      {
        jobId: '1d9e8c1a-e653-4d31-a799-2685e41da214',
        userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
        status: 'open',
        createdAt: '2020-11-11T04:17:23.131Z',
        createdBy: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
        id: '2d9e8c1a-e653-4d31-a799-2685e41da214'
      }
    ]
  },
  {
    projectId: 9056,
    externalId: '1212',
    description: 'Dummy Description',
    startDate: '2020-09-29T04:17:23.131Z',
    endDate: '2020-10-17T04:17:23.131Z',
    numPositions: 11,
    resourceType: 'Dummy Resource Type',
    rateType: 'hourly',
    skills: [
      'cb01fd31-e8d2-4e34-8bf3-b149705de3e1',
      '59ee7b42-f3f3-48c9-bdca-e8396b241793',
      'bcfc8806-cae6-47ff-b0c9-f604acfc8c99'
    ],
    status: 'sourcing',
    createdAt: '2020-11-11T04:17:23.131Z',
    createdBy: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
    id: '1d9e8c1a-e653-4d31-a799-2685e41da213',
    candidates: [
      {
        jobId: '1d9e8c1a-e653-4d31-a799-2685e41da213',
        userId: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
        status: 'open',
        createdAt: '2020-11-11T04:17:23.131Z',
        createdBy: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
        id: '2d9e8c1a-e653-4d31-a799-2685e41da213'
      }
    ]
  },
  {
    projectId: 9050,
    externalId: '1212',
    description: 'Dummy Description',
    startDate: '2020-09-27T04:17:23.131Z',
    endDate: '2020-10-17T04:17:23.131Z',
    numPositions: 13,
    resourceType: 'Dummy Resource Type',
    rateType: 'hourly',
    skills: [
      'cb01fd31-e8d2-4e34-8bf3-b149705de3e1',
      '59ee7b42-f3f3-48c9-bdca-e8396b241793',
      '1b585c26-2649-4078-8369-b599fe6a9d75',
      '8b757998-ff7d-4b3a-9fee-a49d3e41da03',
      'bcfc8806-cae6-47ff-b0c9-f604acfc8c99'
    ],
    status: 'sourcing',
    createdAt: '2020-11-11T04:17:23.131Z',
    createdBy: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
    id: '1d9e8c1a-e653-4d31-a799-2685e41da212',
    candidates: [
      {
        jobId: '1d9e8c1a-e653-4d31-a799-2685e41da212',
        userId: '5bd69a82-c2cb-476f-9462-0883d3b28b90',
        status: 'open',
        createdAt: '2020-11-11T04:17:23.131Z',
        createdBy: 'a55fe1bc-1754-45fa-9adc-cf3d6d7c377a',
        id: '2d9e8c1a-e653-4d31-a799-2685e41da212'
      }
    ]
  }
]

const taasTeamItem0ResponseBody = {
  id: 9050,
  name: 'sample',
  weeklyCost: 29.7,
  resources: [
    {
      id: '1b88e433-828b-4e0d-9fb5-ef75b9dcca6e',
      handle: 'PE335869',
      firstName: ' Peddaram',
      lastName: ' Varalakshmi'
    },
    {
      id: '10803918-ded0-4906-9442-65dc8819de91',
      handle: 'Gayathri_1994',
      firstName: 'Gayathri',
      lastName: 'Sekar',
      photo_url: 'https://topcoder-dev-media.s3.amazonaws.com/member/profile/TonyJ-1604301092491.jpeg'
    },
    {
      id: '5bd69a82-c2cb-476f-9462-0883d3b28b90',
      handle: 'Sandrine_Kuvalis98',
      firstName: 'Mekhi',
      lastName: 'Tremblay'
    }
  ],
  startDate: new Date('2020-09-22T04:17:23.131Z'),
  endDate: new Date('2021-11-11T04:17:23.131Z'),
  totalPositions: 13
}

const taasTeam9050ResponseBody = {
  id: 9050,
  name: 'sample',
  weeklyCost: 29.7,
  resources: [
    {
      id: '1b88e433-828b-4e0d-9fb5-ef75b9dcca6e',
      handle: 'PE335869',
      firstName: ' Peddaram',
      lastName: ' Varalakshmi',
      customerRate: 13,
      job: {
        id: '1d9e8c1a-e653-4d31-a799-2685e41da212',
        name: 'Dummy Description'
      },
      skills: [
        {
          id: '5d313a7b-795b-42a2-9e7e-dc5e81c2f2b5',
          name: 'Java'
        },
        {
          id: 'cb01fd31-e8d2-4e34-8bf3-b149705de3e1',
          name: 'ACI Concrete Strength Testing Technician'
        }

      ],
      skillMatched: 1
    },
    {
      id: '10803918-ded0-4906-9442-65dc8819de91',
      handle: 'Gayathri_1994',
      firstName: 'Gayathri',
      lastName: 'Sekar',
      customerRate: 14.5,
      photo_url: 'https://topcoder-dev-media.s3.amazonaws.com/member/profile/TonyJ-1604301092491.jpeg',
      job: {
        id: '1d9e8c1a-e653-4d31-a799-2685e41da213',
        name: 'Dummy Description'
      },
      skills: [
        {
          id: '5d313a7b-795b-42a2-9e7e-dc5e81c2f2b5',
          name: 'Java'
        },
        {
          id: 'cb01fd31-e8d2-4e34-8bf3-b149705de3e1',
          name: 'ACI Concrete Strength Testing Technician'
        }
      ],
      skillMatched: 1
    },
    {
      id: '5bd69a82-c2cb-476f-9462-0883d3b28b90',
      handle: 'Sandrine_Kuvalis98',
      firstName: 'Mekhi',
      lastName: 'Tremblay',
      customerRate: 16.7,
      job: {
        id: '1d9e8c1a-e653-4d31-a799-2685e41da214',
        name: 'Dummy Description'
      },
      skills: [
        {
          id: '5d313a7b-795b-42a2-9e7e-dc5e81c2f2b5',
          name: 'Java'
        },
        {
          id: 'cb01fd31-e8d2-4e34-8bf3-b149705de3e1',
          name: 'ACI Concrete Strength Testing Technician'
        }
      ],
      skillMatched: 1
    }
  ],
  startDate: new Date('2020-09-22T04:17:23.131Z'),
  endDate: new Date('2021-11-11T04:17:23.131Z'),
  jobs: [
    {
      id: '1d9e8c1a-e653-4d31-a799-2685e41da212',
      description: 'Dummy Description',
      startDate: '2020-09-27T04:17:23.131Z',
      endDate: '2020-10-17T04:17:23.131Z',
      numPositions: 13,
      rateType: 'hourly',
      skills: [
        {
          id: 'cb01fd31-e8d2-4e34-8bf3-b149705de3e1',
          name: 'ACI Concrete Strength Testing Technician'
        },
        {
          id: '59ee7b42-f3f3-48c9-bdca-e8396b241793',
          name: '2D Computer Graphics'
        },
        {
          id: '1b585c26-2649-4078-8369-b599fe6a9d75',
          name: 'ACCP Certified'
        },
        {
          id: '8b757998-ff7d-4b3a-9fee-a49d3e41da03',
          name: '3D Projection'
        },
        {
          id: 'bcfc8806-cae6-47ff-b0c9-f604acfc8c99',
          name: '35 Mm Films'
        }
      ],
      status: 'sourcing'
    }
  ]
}

const jobDetailResponseBody = {
  id: '1d9e8c1a-e653-4d31-a799-2685e41da212',
  description: 'Dummy Description',
  candidates: [
    {
      id: '5bd69a82-c2cb-476f-9462-0883d3b28b90',
      handle: 'Sandrine_Kuvalis98',
      firstName: 'Mekhi',
      lastName: 'Tremblay',
      resumeLink: null,
      status: 'open',
      skills: [
        {
          id: '5d313a7b-795b-42a2-9e7e-dc5e81c2f2b5',
          name: 'Java'
        },
        {
          id: 'cb01fd31-e8d2-4e34-8bf3-b149705de3e1',
          name: 'ACI Concrete Strength Testing Technician'
        }
      ],
      job: {
        id: '1d9e8c1a-e653-4d31-a799-2685e41da214',
        name: 'Dummy Description'
      },
      skillMatched: 1,
      customerRate: 16.7
    }
  ]
}

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
  unexpected,
  projectRequestBody,
  userRequestBody,
  memberRequestBody,
  skillsRequestBody,
  userSkillsRequestBody,
  resourceBookingsRequestBody,
  jobsRequestBody,
  taasTeamItem0ResponseBody,
  taasTeam9050ResponseBody,
  jobDetailResponseBody
}
