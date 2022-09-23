const config = require('config')
const apiTestLib = require('tc-api-testing-lib')
const envHelper = require('./testHelper')
const logger = require('../../src/common/logger')

const healthCheckRequests = [
  {
    folder: 'health check',
    iterationData: require('./testData/health/health-check.json')
  }
]

const jobRequests = [
  {
    folder: 'create job successfully',
    iterationData: require('./testData/job/create-job-successfully.json')
  },
  {
    folder: 'create job by invalid token',
    iterationData: require('./testData/job/create-job-by-invalid-token.json')
  },
  {
    folder: 'create job by non member of project',
    iterationData: require('./testData/job/create-job-by-non-member-of-project.json')
  },
  {
    folder: 'create job by invalid field',
    iterationData: require('./testData/job/create-job-by-invalid-field.json')
  },
  {
    folder: 'create job by missing field',
    iterationData: require('./testData/job/create-job-by-missing-field.json')
  },
  {
    folder: 'wait for es processor'
  },
  {
    folder: 'get job successfully',
    iterationData: require('./testData/job/get-job-successfully.json')
  },
  {
    folder: 'get job successfully fromDb',
    iterationData: require('./testData/job/get-job-successfully-fromDb.json')
  },
  {
    folder: 'get job by invalid token',
    iterationData: require('./testData/job/get-job-by-invalid-token.json')
  },
  {
    folder: 'get job by non member of project',
    iterationData: require('./testData/job/get-job-by-non-member-of-project.json')
  },
  {
    folder: 'get job by invalid id',
    iterationData: require('./testData/job/get-job-by-invalid-id.json')
  },
  {
    folder: 'search jobs successfully',
    iterationData: require('./testData/job/search-jobs-successfully.json')
  },
  {
    folder: 'search jobs by invalid token',
    iterationData: require('./testData/job/search-jobs-by-invalid-token.json')
  },
  {
    folder: 'search jobs by invalid field',
    iterationData: require('./testData/job/search-jobs-by-invalid-field.json')
  },
  {
    folder: 'search jobs by non member of project',
    iterationData: require('./testData/job/search-jobs-by-non-member-of-project.json')
  },
  {
    folder: 'fully update job successfully',
    iterationData: require('./testData/job/fully-update-job-successfully.json')
  },
  {
    folder: 'fully update job by invalid token',
    iterationData: require('./testData/job/fully-update-job-by-invalid-token.json')
  },
  {
    folder: 'fully update job by invalid field',
    iterationData: require('./testData/job/fully-update-job-by-invalid-field.json')
  },
  {
    folder: 'fully update job by missing field',
    iterationData: require('./testData/job/fully-update-job-by-missing-field.json')
  },
  {
    folder: 'fully update job by invalid id',
    iterationData: require('./testData/job/fully-update-job-by-invalid-id.json')
  },
  {
    folder: 'partially update job successfully',
    iterationData: require('./testData/job/partially-update-job-successfully.json')
  },
  {
    folder: 'partially update job by invalid token',
    iterationData: require('./testData/job/partially-update-job-by-invalid-token.json')
  },
  {
    folder: 'partially update job by invalid field',
    iterationData: require('./testData/job/partially-update-job-by-invalid-field.json')
  },
  {
    folder: 'partially update job by invalid id',
    iterationData: require('./testData/job/partially-update-job-by-invalid-id.json')
  },
  {
    folder: 'delete job by invalid token',
    iterationData: require('./testData/job/delete-job-by-invalid-token.json')
  },
  {
    folder: 'delete job by no admin',
    iterationData: require('./testData/job/delete-job-by-no-admin.json')
  },
  {
    folder: 'delete job by invalid id',
    iterationData: require('./testData/job/delete-job-by-invalid-id.json')
  },
  {
    folder: 'delete job successfully',
    iterationData: require('./testData/job/delete-job-successfully.json')
  }
]

const jobCandidateRequests = [
  {
    folder: 'create job candidate successfully',
    iterationData: require('./testData/jobCandidate/create-jobCandidate-successfully.json')
  },
  {
    folder: 'create job candidate by invalid token',
    iterationData: require('./testData/jobCandidate/create-jobCandidate-by-invalid-token.json')
  },
  {
    folder: 'create job candidate by no admin',
    iterationData: require('./testData/jobCandidate/create-jobCandidate-by-no-admin.json')
  },
  {
    folder: 'create job candidate by nonexistent ids',
    iterationData: require('./testData/jobCandidate/create-jobCandidate-by-nonexistent-ids.json')
  },
  {
    folder: 'create job candidate by invalid field',
    iterationData: require('./testData/jobCandidate/create-jobCandidate-by-invalid-field.json')
  },
  {
    folder: 'create job candidate by missing field',
    iterationData: require('./testData/jobCandidate/create-jobCandidate-by-missing-field.json')
  },
  {
    folder: 'wait for es processor'
  },
  {
    folder: 'get job candidate successfully',
    iterationData: require('./testData/jobCandidate/get-jobCandidate-successfully.json')
  },
  {
    folder: 'get job candidate successfully fromDb',
    iterationData: require('./testData/jobCandidate/get-jobCandidate-successfully-fromDb.json')
  },
  {
    folder: 'get job candidate by invalid token',
    iterationData: require('./testData/jobCandidate/get-jobCandidate-by-invalid-token.json')
  },
  {
    folder: 'get job candidate by non member of project',
    iterationData: require('./testData/jobCandidate/get-jobCandidate-by-non-member-of-project.json')
  },
  {
    folder: 'get job candidate by invalid id',
    iterationData: require('./testData/jobCandidate/get-jobCandidate-by-invalid-id.json')
  },
  {
    folder: 'search job candidates successfully',
    iterationData: require('./testData/jobCandidate/search-jobCandidates-successfully.json')
  },
  {
    folder: 'search job candidates by invalid token',
    iterationData: require('./testData/jobCandidate/search-jobCandidates-by-invalid-token.json')
  },
  {
    folder: 'search job candidates by invalid field',
    iterationData: require('./testData/jobCandidate/search-jobCandidates-by-invalid-field.json')
  },
  {
    folder: 'search job candidates by non member of project',
    iterationData: require('./testData/jobCandidate/search-jobCandidates-by-non-member-of-project.json')
  },
  {
    folder: 'fully update job candidate successfully',
    iterationData: require('./testData/jobCandidate/fully-update-jobCandidate-successfully.json')
  },
  {
    folder: 'fully update job candidate by invalid token',
    iterationData: require('./testData/jobCandidate/fully-update-jobCandidate-by-invalid-token.json')
  },
  {
    folder: 'fully update job candidate by non member of project',
    iterationData: require('./testData/jobCandidate/fully-update-jobCandidate-by-non-member-of-project.json')
  },
  {
    folder: 'fully update job candidate by invalid field',
    iterationData: require('./testData/jobCandidate/fully-update-jobCandidate-by-invalid-field.json')
  },
  {
    folder: 'fully update job candidate by invalid id',
    iterationData: require('./testData/jobCandidate/fully-update-jobCandidate-by-invalid-id.json')
  },
  {
    folder: 'fully update job candidate by missing field',
    iterationData: require('./testData/jobCandidate/fully-update-jobCandidate-by-missing-field.json')
  },
  {
    folder: 'partially update job candidate successfully',
    iterationData: require('./testData/jobCandidate/partially-update-jobCandidate-successfully.json')
  },
  {
    folder: 'partially update job candidate by invalid token',
    iterationData: require('./testData/jobCandidate/partially-update-jobCandidate-by-invalid-token.json')
  },
  {
    folder: 'partially update job candidate by no member of project',
    iterationData: require('./testData/jobCandidate/partially-update-jobCandidate-by-non-member-of-project.json')
  },
  {
    folder: 'partially update job candidate by invalid field',
    iterationData: require('./testData/jobCandidate/partially-update-jobCandidate-by-invalid-field.json')
  },
  {
    folder: 'partially update job candidate by invalid id',
    iterationData: require('./testData/jobCandidate/partially-update-jobCandidate-by-invalid-id.json')
  },
  {
    folder: 'delete job candidate by invalid token',
    iterationData: require('./testData/jobCandidate/delete-jobCandidate-by-invalid-token.json')
  },
  {
    folder: 'delete job candidate by no admin',
    iterationData: require('./testData/jobCandidate/delete-jobCandidate-by-no-admin.json')
  },
  {
    folder: 'delete job candidate by invalid id',
    iterationData: require('./testData/jobCandidate/delete-jobCandidate-by-invalid-id.json')
  },
  {
    folder: 'delete job candidate successfully',
    iterationData: require('./testData/jobCandidate/delete-jobCandidate-successfully.json')
  }
]

const resourceBookingRequests = [
  {
    folder: 'create resource booking successfully',
    iterationData: require('./testData/resourceBooking/create-resourceBooking-successfully.json')
  },
  {
    folder: 'create resource booking by invalid token',
    iterationData: require('./testData/resourceBooking/create-resourceBooking-by-invalid-token.json')
  },
  {
    folder: 'create resource booking by no admin',
    iterationData: require('./testData/resourceBooking/create-resourceBooking-by-no-admin.json')
  },
  {
    folder: 'create resource booking by nonexistent ids',
    iterationData: require('./testData/resourceBooking/create-resourceBooking-by-nonexistent-ids.json')
  },
  {
    folder: 'create resource booking by invalid field',
    iterationData: require('./testData/resourceBooking/create-resourceBooking-by-invalid-field.json')
  },
  {
    folder: 'create resource booking by missing field',
    iterationData: require('./testData/resourceBooking/create-resourceBooking-by-missing-field.json')
  },
  {
    folder: 'add dates to resource booking',
    iterationData: require('./testData/resourceBooking/add-dates-to-resourceBooking.json')
  },
  {
    folder: 'wait for es processor'
  },
  {
    folder: 'get resource booking successfully fromDb',
    iterationData: require('./testData/resourceBooking/get-resourceBooking-successfully-fromDb.json')
  },
  {
    folder: 'get resource booking successfully',
    iterationData: require('./testData/resourceBooking/get-resourceBooking-successfully.json')
  },
  {
    folder: 'get resource booking successfully fromDb with parameters',
    iterationData: require('./testData/resourceBooking/get-resourceBooking-successfully-fromDb-with-parameters.json')
  },
  {
    folder: 'get resource booking successfully with parameters',
    iterationData: require('./testData/resourceBooking/get-resourceBooking-successfully-with-parameters.json')
  },
  {
    folder: 'get resource booking by invalid token',
    iterationData: require('./testData/resourceBooking/get-resourceBooking-by-invalid-token.json')
  },
  {
    folder: 'get resource booking by non member of project',
    iterationData: require('./testData/resourceBooking/get-resourceBooking-by-non-member-of-project.json')
  },
  {
    folder: 'get resource booking by invalid id',
    iterationData: require('./testData/resourceBooking/get-resourceBooking-by-invalid-id.json')
  },
  {
    folder: 'get resource booking by invalid parameters',
    iterationData: require('./testData/resourceBooking/get-resourceBooking-by-invalid-parameters.json')
  },
  {
    folder: 'search resource booking successfully',
    iterationData: require('./testData/resourceBooking/search-resourceBooking-successfully.json')
  },
  {
    folder: 'search resource booking by invalid token',
    iterationData: require('./testData/resourceBooking/search-resourceBooking-by-invalid-token.json')
  },
  {
    folder: 'search resource booking by non member of project',
    iterationData: require('./testData/resourceBooking/search-resourceBooking-by-non-member-of-project.json')
  },
  {
    folder: 'search resource booking by invalid field',
    iterationData: require('./testData/resourceBooking/search-resourceBooking-by-invalid-field.json')
  },
  {
    folder: 'fully update resource booking successfully',
    iterationData: require('./testData/resourceBooking/fully-update-resourceBooking-successfully.json')
  },
  {
    folder: 'fully update resource booking by invalid token',
    iterationData: require('./testData/resourceBooking/fully-update-resourceBooking-by-invalid-token.json')
  },
  {
    folder: 'fully update resource booking by no admin',
    iterationData: require('./testData/resourceBooking/fully-update-resourceBooking-by-no-admin.json')
  },
  {
    folder: 'fully update resource booking by nonexistent ids',
    iterationData: require('./testData/resourceBooking/fully-update-resourceBooking-by-nonexistent-ids.json')
  },
  {
    folder: 'fully update resource booking by invalid field',
    iterationData: require('./testData/resourceBooking/fully-update-resourceBooking-by-invalid-field.json')
  },
  {
    folder: 'fully update resource booking by missing field',
    iterationData: require('./testData/resourceBooking/fully-update-resourceBooking-by-missing-field.json')
  },
  {
    folder: 'partially update resource booking successfully',
    iterationData: require('./testData/resourceBooking/partially-update-resourceBooking-successfully.json')
  },
  {
    folder: 'partially update resource booking by invalid token',
    iterationData: require('./testData/resourceBooking/partially-update-resourceBooking-by-invalid-token.json')
  },
  {
    folder: 'partially update resource booking by no admin',
    iterationData: require('./testData/resourceBooking/partially-update-resourceBooking-by-no-admin.json')
  },
  {
    folder: 'partially update resource booking by nonexistent ids',
    iterationData: require('./testData/resourceBooking/partially-update-resourceBooking-by-nonexistent-ids.json')
  },
  {
    folder: 'partially update resource booking by invalid field',
    iterationData: require('./testData/resourceBooking/partially-update-resourceBooking-by-invalid-field.json')
  },
  {
    folder: 'delete resource booking by invalid token',
    iterationData: require('./testData/resourceBooking/delete-resourceBooking-by-invalid-token.json')
  },
  {
    folder: 'delete resource booking by no admin',
    iterationData: require('./testData/resourceBooking/delete-resourceBooking-by-no-admin.json')
  },
  {
    folder: 'delete resource booking by invalid id',
    iterationData: require('./testData/resourceBooking/delete-resourceBooking-by-invalid-id.json')
  },
  {
    folder: 'delete resource booking successfully',
    iterationData: require('./testData/resourceBooking/delete-resourceBooking-successfully.json')
  }
]

const workPeriodRequests = [
  {
    folder: 'create work period successfully',
    iterationData: require('./testData/workPeriod/create-workPeriod-successfully.json')
  },
  {
    folder: 'create work period by invalid token',
    iterationData: require('./testData/workPeriod/create-workPeriod-by-invalid-token.json')
  },
  {
    folder: 'create work period by no admin',
    iterationData: require('./testData/workPeriod/create-workPeriod-by-no-admin.json')
  },
  {
    folder: 'create work period by nonexistent ids',
    iterationData: require('./testData/workPeriod/create-workPeriod-by-nonexistent-ids.json')
  },
  {
    folder: 'create work period by invalid field',
    iterationData: require('./testData/workPeriod/create-workPeriod-by-invalid-field.json')
  },
  {
    folder: 'create work period by missing field',
    iterationData: require('./testData/workPeriod/create-workPeriod-by-missing-field.json')
  },
  {
    folder: 'wait for es processor'
  },
  {
    folder: 'get work period successfully',
    iterationData: require('./testData/workPeriod/get-workPeriod-successfully.json')
  },
  {
    folder: 'get work period successfully fomDb',
    iterationData: require('./testData/workPeriod/get-workPeriod-successfully-fromDb.json')
  },
  {
    folder: 'get work period by invalid token',
    iterationData: require('./testData/workPeriod/get-workPeriod-by-invalid-token.json')
  },
  {
    folder: 'get work period by non member of project',
    iterationData: require('./testData/workPeriod/get-workPeriod-by-non-member-of-project.json')
  },
  {
    folder: 'get work period by invalid id',
    iterationData: require('./testData/workPeriod/get-workPeriod-by-invalid-id.json')
  },
  {
    folder: 'search work period successfully',
    iterationData: require('./testData/workPeriod/search-workPeriod-successfully.json')
  },
  {
    folder: 'search work period by invalid token',
    iterationData: require('./testData/workPeriod/search-workPeriod-by-invalid-token.json')
  },
  {
    folder: 'search work period by non member of project',
    iterationData: require('./testData/workPeriod/search-workPeriod-by-non-member-of-project.json')
  },
  {
    folder: 'search work period by invalid field',
    iterationData: require('./testData/workPeriod/search-workPeriod-by-invalid-field.json')
  },
  {
    folder: 'fully update work period successfully',
    iterationData: require('./testData/workPeriod/fully-update-workPeriod-successfully.json')
  },
  {
    folder: 'fully update work period by invalid token',
    iterationData: require('./testData/workPeriod/fully-update-workPeriod-by-invalid-token.json')
  },
  {
    folder: 'fully update work period by no admin',
    iterationData: require('./testData/workPeriod/fully-update-workPeriod-by-no-admin.json')
  },
  {
    folder: 'fully update work period already exists',
    iterationData: require('./testData/workPeriod/fully-update-workPeriod-already-exist.json')
  },
  {
    folder: 'fully update work period by nonexistent ids',
    iterationData: require('./testData/workPeriod/fully-update-workPeriod-by-nonexistent-ids.json')
  },
  {
    folder: 'fully update work period by invalid field',
    iterationData: require('./testData/workPeriod/fully-update-workPeriod-by-invalid-field.json')
  },
  {
    folder: 'fully update work period by missing field',
    iterationData: require('./testData/workPeriod/fully-update-workPeriod-by-missing-field.json')
  },
  {
    folder: 'partially update work period successfully',
    iterationData: require('./testData/workPeriod/partially-update-workPeriod-successfully.json')
  },
  {
    folder: 'partially update work period by invalid token',
    iterationData: require('./testData/workPeriod/partially-update-workPeriod-by-invalid-token.json')
  },
  {
    folder: 'partially update work period by no admin',
    iterationData: require('./testData/workPeriod/partially-update-workPeriod-by-no-admin.json')
  },
  {
    folder: 'partially update work period already exists',
    iterationData: require('./testData/workPeriod/partially-update-workPeriod-already-exist.json')
  },
  {
    folder: 'partially update work period by nonexistent ids',
    iterationData: require('./testData/workPeriod/partially-update-workPeriod-by-nonexistent-ids.json')
  },
  {
    folder: 'partially update work period by invalid field',
    iterationData: require('./testData/workPeriod/partially-update-workPeriod-by-invalid-field.json')
  },
  {
    folder: 'delete work period by invalid token',
    iterationData: require('./testData/workPeriod/delete-workPeriod-by-invalid-token.json')
  },
  {
    folder: 'delete work period by no admin',
    iterationData: require('./testData/workPeriod/delete-workPeriod-by-no-admin.json')
  },
  {
    folder: 'delete work period by invalid id',
    iterationData: require('./testData/workPeriod/delete-workPeriod-by-invalid-id.json')
  },
  {
    folder: 'delete work period with paid status',
    iterationData: require('./testData/workPeriod/delete-workPeriod-by-with-paid-status.json')
  },
  {
    folder: 'delete work period successfully',
    iterationData: require('./testData/workPeriod/delete-workPeriod-successfully.json')
  }
]

const workPeriodPaymentRequests = [
  {
    folder: 'create work period payment successfully',
    iterationData: require('./testData/workPeriodPayment/create-workPeriodPayment-successfully.json')
  },
  {
    folder: 'create work period payment by invalid token',
    iterationData: require('./testData/workPeriodPayment/create-workPeriodPayment-by-invalid-token.json')
  },
  {
    folder: 'create work period payment by no admin',
    iterationData: require('./testData/workPeriodPayment/create-workPeriodPayment-by-no-admin.json')
  },
  {
    folder: 'create work period payment by nonexistent ids',
    iterationData: require('./testData/workPeriodPayment/create-workPeriodPayment-by-nonexistent-ids.json')
  },
  {
    folder: 'create work period payment without billing account',
    iterationData: require('./testData/workPeriodPayment/create-workPeriodPayment-without-billing-account.json')
  },
  {
    folder: 'create work period payment by invalid field',
    iterationData: require('./testData/workPeriodPayment/create-workPeriodPayment-by-invalid-field.json')
  },
  {
    folder: 'create work period payment by missing field',
    iterationData: require('./testData/workPeriodPayment/create-workPeriodPayment-by-missing-field.json')
  },
  {
    folder: 'wait for es processor'
  },
  {
    folder: 'get work period payment successfully',
    iterationData: require('./testData/workPeriodPayment/get-workPeriodPayment-successfully.json')
  },
  {
    folder: 'get work period payment successfully fromDb',
    iterationData: require('./testData/workPeriodPayment/get-workPeriodPayment-successfully-fromDb.json')
  },
  {
    folder: 'get work period payment by invalid token',
    iterationData: require('./testData/workPeriodPayment/get-workPeriodPayment-by-invalid-token.json')
  },
  {
    folder: 'get work period payment by no admin',
    iterationData: require('./testData/workPeriodPayment/get-workPeriodPayment-by-no-admin.json')
  },
  {
    folder: 'get work period payment by invalid id',
    iterationData: require('./testData/workPeriodPayment/get-workPeriodPayment-by-invalid-id.json')
  },
  {
    folder: 'search work period payment successfully',
    iterationData: require('./testData/workPeriodPayment/search-workPeriodPayment-successfully.json')
  },
  {
    folder: 'search work period payment by invalid token',
    iterationData: require('./testData/workPeriodPayment/search-workPeriodPayment-by-invalid-token.json')
  },
  {
    folder: 'search work period payment by no admin',
    iterationData: require('./testData/workPeriodPayment/search-workPeriodPayment-by-no-admin.json')
  },
  {
    folder: 'search work period payment by invalid field',
    iterationData: require('./testData/workPeriodPayment/search-workPeriodPayment-by-invalid-field.json')
  },
  {
    folder: 'fully update work period payment successfully',
    iterationData: require('./testData/workPeriodPayment/fully-update-workPeriodPayment-successfully.json')
  },
  {
    folder: 'fully update work period payment by invalid token',
    iterationData: require('./testData/workPeriodPayment/fully-update-workPeriodPayment-by-invalid-token.json')
  },
  {
    folder: 'fully update work period payment by no admin',
    iterationData: require('./testData/workPeriodPayment/fully-update-workPeriodPayment-by-no-admin.json')
  },
  {
    folder: 'fully update work period payment by nonexistent ids',
    iterationData: require('./testData/workPeriodPayment/fully-update-workPeriodPayment-by-nonexistent-ids.json')
  },
  {
    folder: 'fully update work period payment by invalid field',
    iterationData: require('./testData/workPeriodPayment/fully-update-workPeriodPayment-by-invalid-field.json')
  },
  {
    folder: 'fully update work period payment by missing field',
    iterationData: require('./testData/workPeriodPayment/fully-update-workPeriodPayment-by-missing-field.json')
  },
  {
    folder: 'partially update work period payment successfully',
    iterationData: require('./testData/workPeriodPayment/partially-update-workPeriodPayment-successfully.json')
  },
  {
    folder: 'partially update work period payment by invalid token',
    iterationData: require('./testData/workPeriodPayment/partially-update-workPeriodPayment-by-invalid-token.json')
  },
  {
    folder: 'partially update work period payment by no admin',
    iterationData: require('./testData/workPeriodPayment/partially-update-workPeriodPayment-by-no-admin.json')
  },
  {
    folder: 'partially update work period payment by nonexistent ids',
    iterationData: require('./testData/workPeriodPayment/partially-update-workPeriodPayment-by-nonexistent-ids.json')
  },
  {
    folder: 'partially update work period payment by invalid field',
    iterationData: require('./testData/workPeriodPayment/partially-update-workPeriodPayment-by-invalid-field.json')
  }
]

const interviewRequests = [
  {
    folder: 'request interview successfully',
    iterationData: require('./testData/interview/request-interview-successfully.json')
  },
  {
    folder: 'request interview by invalid token',
    iterationData: require('./testData/interview/request-interview-by-invalid-token.json')
  },
  {
    folder: 'request interview by non member of project',
    iterationData: require('./testData/interview/request-interview-by-non-member-of-project.json')
  },
  {
    folder: 'request interview exceeded',
    iterationData: require('./testData/interview/request-interview-exceeded.json')
  },
  {
    folder: 'request interview by nonexistent ids',
    iterationData: require('./testData/interview/request-interview-by-nonexistent-ids.json')
  },
  {
    folder: 'request interview by invalid field',
    iterationData: require('./testData/interview/request-interview-by-invalid-field.json')
  },
  {
    folder: 'request interview by missing field',
    iterationData: require('./testData/interview/request-interview-by-missing-field.json')
  },
  {
    folder: 'wait for es processor'
  },
  {
    folder: 'get interview by id successfully',
    iterationData: require('./testData/interview/get-interview-by-id-successfully.json')
  },
  {
    folder: 'get interview by id successfully fromDb',
    iterationData: require('./testData/interview/get-interview-by-id-successfully-fromDb.json')
  },
  {
    folder: 'get interview by id by invalid token',
    iterationData: require('./testData/interview/get-interview-by-id-by-invalid-token.json')
  },
  {
    folder: 'get interview by id by invalid id',
    iterationData: require('./testData/interview/get-interview-by-id-by-invalid-id.json')
  },
  {
    folder: 'get interview by id by non member of project',
    iterationData: require('./testData/interview/get-interview-by-id-by-non-member-of-project.json')
  },
  {
    folder: 'get interview by round successfully',
    iterationData: require('./testData/interview/get-interview-by-round-successfully.json')
  },
  {
    folder: 'get interview by round successfully fromDb',
    iterationData: require('./testData/interview/get-interview-by-round-successfully-fromDb.json')
  },
  {
    folder: 'get interview by round by invalid token',
    iterationData: require('./testData/interview/get-interview-by-round-by-invalid-token.json')
  },
  {
    folder: 'get interview by round by invalid id',
    iterationData: require('./testData/interview/get-interview-by-round-by-invalid-id.json')
  },
  {
    folder: 'get interview by round by non member of project',
    iterationData: require('./testData/interview/get-interview-by-round-by-non-member-of-project.json')
  },
  {
    folder: 'search interviews successfully',
    iterationData: require('./testData/interview/search-interviews-successfully.json')
  },
  {
    folder: 'search interviews by invalid token',
    iterationData: require('./testData/interview/search-interviews-by-invalid-token.json')
  },
  {
    folder: 'search interviews by non member of project',
    iterationData: require('./testData/interview/search-interviews-by-non-member-of-project.json')
  },
  {
    folder: 'search interviews by invalid field',
    iterationData: require('./testData/interview/search-interviews-by-invalid-field.json')
  },
  {
    folder: 'update interview by id successfully',
    iterationData: require('./testData/interview/update-interview-by-id-successfully.json')
  },
  {
    folder: 'update interview by id by invalid token',
    iterationData: require('./testData/interview/update-interview-by-id-by-invalid-token.json')
  },
  {
    folder: 'update interview by id by nonexistent ids',
    iterationData: require('./testData/interview/update-interview-by-id-by-nonexistent-ids.json')
  },
  {
    folder: 'update interview by id by invalid field',
    iterationData: require('./testData/interview/update-interview-by-id-by-invalid-field.json')
  },
  {
    folder: 'update interview by id by missing field',
    iterationData: require('./testData/interview/update-interview-by-id-by-missing-field.json')
  },
  {
    folder: 'update completed interview by id',
    iterationData: require('./testData/interview/update-completed-interview-by-id.json')
  },
  {
    folder: 'update completed interview by round',
    iterationData: require('./testData/interview/update-completed-interview-by-round.json')
  },
  {
    folder: 'update interview by round successfully',
    iterationData: require('./testData/interview/update-interview-by-round-successfully.json')
  },
  {
    folder: 'update interview by round by invalid token',
    iterationData: require('./testData/interview/update-interview-by-round-by-invalid-token.json')
  },
  {
    folder: 'update interview by round by non existent ids',
    iterationData: require('./testData/interview/update-interview-by-round-by-nonexistent-ids.json')
  },
  {
    folder: 'update interview by round by invalid field',
    iterationData: require('./testData/interview/update-interview-by-round-by-invalid-field.json')
  },
  {
    folder: 'update interview by round by missing field',
    iterationData: require('./testData/interview/update-interview-by-round-by-missing-field.json')
  }
]

const taasTeamRequests = [
  {
    folder: 'search teams successfully',
    iterationData: require('./testData/taasTeam/search-taasTeams-successfully.json')
  },
  {
    folder: 'search teams by invalid token',
    iterationData: require('./testData/taasTeam/search-taasTeams-by-invalid-token.json')
  },
  {
    folder: 'search teams by invalid field',
    iterationData: require('./testData/taasTeam/search-taasTeams-by-invalid-field.json')
  },
  {
    folder: 'send email successfully',
    iterationData: require('./testData/taasTeam/send-email-successfully.json')
  },
  {
    folder: 'send email by invalid token',
    iterationData: require('./testData/taasTeam/send-email-by-invalid-token.json')
  },
  {
    folder: 'send email by invalid field',
    iterationData: require('./testData/taasTeam/send-email-by-invalid-field.json')
  },
  {
    folder: 'send email by missing field',
    iterationData: require('./testData/taasTeam/send-email-by-missing-field.json')
  },
  {
    folder: 'search skills successfully',
    iterationData: require('./testData/taasTeam/search-skills-successfully.json')
  },
  {
    folder: 'search skills by invalid token',
    iterationData: require('./testData/taasTeam/search-skills-by-invalid-token.json')
  },
  {
    folder: 'get me successfully',
    iterationData: require('./testData/taasTeam/get-me-successfully.json')
  },
  {
    folder: 'get me by invalid token',
    iterationData: require('./testData/taasTeam/get-me-by-invalid-token.json')
  },
  {
    folder: 'get team successfully',
    iterationData: require('./testData/taasTeam/get-taasTeam-successfully.json')
  },
  {
    folder: 'get team by invalid token',
    iterationData: require('./testData/taasTeam/get-taasTeam-by-invalid-token.json')
  },
  {
    folder: 'get team by invalid id',
    iterationData: require('./testData/taasTeam/get-taasTeam-by-invalid-id.json')
  },
  {
    folder: 'get team job successfully',
    iterationData: require('./testData/taasTeam/get-taasTeamJob-successfully.json')
  },
  {
    folder: 'get team job by invalid token',
    iterationData: require('./testData/taasTeam/get-taasTeamJob-by-invalid-token.json')
  },
  {
    folder: 'get team job by invalid id',
    iterationData: require('./testData/taasTeam/get-taasTeamJob-by-invalid-id.json')
  },
  {
    folder: 'add members successfully',
    iterationData: require('./testData/taasTeam/add-members-successfully.json')
  },
  {
    folder: 'add members by invalid token',
    iterationData: require('./testData/taasTeam/add-members-by-invalid-token.json')
  },
  {
    folder: 'add members by invalid id',
    iterationData: require('./testData/taasTeam/add-members-by-invalid-id.json')
  },
  {
    folder: 'add members by invalid field',
    iterationData: require('./testData/taasTeam/add-members-by-invalid-field.json')
  },
  {
    folder: 'search members successfully',
    iterationData: require('./testData/taasTeam/search-members-successfully.json')
  },
  {
    folder: 'search members by invalid token',
    iterationData: require('./testData/taasTeam/search-members-by-invalid-token.json')
  },
  {
    folder: 'search members by invalid id',
    iterationData: require('./testData/taasTeam/search-members-by-invalid-id.json')
  },
  {
    folder: 'search invites successfully',
    iterationData: require('./testData/taasTeam/search-invites-successfully.json')
  },
  {
    folder: 'search invites by invalid token',
    iterationData: require('./testData/taasTeam/search-invites-by-invalid-token.json')
  },
  {
    folder: 'search invites by invalid id',
    iterationData: require('./testData/taasTeam/search-invites-by-invalid-id.json')
  },
  {
    folder: 'delete member successfully',
    iterationData: require('./testData/taasTeam/delete-member-successfully.json')
  },
  {
    folder: 'delete member by invalid token',
    iterationData: require('./testData/taasTeam/delete-member-by-invalid-token.json')
  },
  {
    folder: 'delete member by invalid id',
    iterationData: require('./testData/taasTeam/delete-member-by-invalid-id.json')
  }
]

const requests = [
  //...healthCheckRequests,
  // ...jobRequests,
  // ...jobCandidateRequests,
  ...resourceBookingRequests,
  // ...workPeriodRequests,
  // ...workPeriodPaymentRequests,
  // ...interviewRequests,
  // ...taasTeamRequests
]

/**
 * Clear the test data.
 * @return {Promise<void>}
 */
async function clearTestData () {
  logger.info('Clear the Postman test data.')
  logger.info(`${config.API_BASE_URL}/${config.API_VERSION}/taas/internal/jobs/clean`);
  await envHelper.postRequest(`${config.API_BASE_URL}/${config.API_VERSION}/taas/internal/jobs/clean`)
  logger.info('Finished clear the Postman test data.')
}

/**
 * Run the postman tests.
 */
apiTestLib.runTests(requests, require.resolve('./topcoder-bookings-api.postman_collection.json'),
  require.resolve('./topcoder-bookings-api.postman_environment.json')).then(async () => {
  logger.info('newman test completed!')
  await clearTestData()
}).catch(async (err) => {
  logger.logFullError(err)

  // Only calling the clean up function when it is not validation error.
  if (err.name !== 'ValidationError') {
    await clearTestData()
  }
})
