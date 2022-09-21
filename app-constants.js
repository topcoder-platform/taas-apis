/**
 * App constants
 */

const UserRoles = {
  BookingManager: 'bookingmanager',
  Administrator: 'administrator',
  ConnectManager: 'Connect Manager',
  TopcoderUser: 'Topcoder User'
}

const FullManagePermissionRoles = [
  UserRoles.BookingManager,
  UserRoles.Administrator
]

const Scopes = {
  // all resources
  ALL_RESOURCES: 'all:resources',
  // job
  READ_JOB: 'read:taas-jobs',
  CREATE_JOB: 'create:taas-jobs',
  UPDATE_JOB: 'update:taas-jobs',
  DELETE_JOB: 'delete:taas-jobs',
  ALL_JOB: 'all:taas-jobs',
  // job candidate
  READ_JOB_CANDIDATE: 'read:taas-jobCandidates',
  CREATE_JOB_CANDIDATE: 'create:taas-jobCandidates',
  UPDATE_JOB_CANDIDATE: 'update:taas-jobCandidates',
  DELETE_JOB_CANDIDATE: 'delete:taas-jobCandidates',
  ALL_JOB_CANDIDATE: 'all:taas-jobCandidates',
  // resource booking
  READ_RESOURCE_BOOKING: 'read:taas-resourceBookings',
  CREATE_RESOURCE_BOOKING: 'create:taas-resourceBookings',
  UPDATE_RESOURCE_BOOKING: 'update:taas-resourceBookings',
  DELETE_RESOURCE_BOOKING: 'delete:taas-resourceBookings',
  ALL_RESOURCE_BOOKING: 'all:taas-resourceBookings',
  // taas-team
  READ_TAAS_TEAM: 'read:taas-teams',
  CREATE_ROLE_SEARCH_REQUEST: 'create:taas-roleSearchRequests',
  CREATE_TAAS_TEAM: 'create:taas-teams',
  // work period
  READ_WORK_PERIOD: 'read:taas-workPeriods',
  CREATE_WORK_PERIOD: 'create:taas-workPeriods',
  UPDATE_WORK_PERIOD: 'update:taas-workPeriods',
  DELETE_WORK_PERIOD: 'delete:taas-workPeriods',
  ALL_WORK_PERIOD: 'all:taas-workPeriods',
  // work period payment
  READ_WORK_PERIOD_PAYMENT: 'read:taas-workPeriodPayments',
  CREATE_WORK_PERIOD_PAYMENT: 'create:taas-workPeriodPayments',
  UPDATE_WORK_PERIOD_PAYMENT: 'update:taas-workPeriodPayments',
  ALL_WORK_PERIOD_PAYMENT: 'all:taas-workPeriodPayments',
  // interview
  READ_INTERVIEW: 'read:taas-interviews',
  CREATE_INTERVIEW: 'create:taas-interviews',
  UPDATE_INTERVIEW: 'update:taas-interviews',
  ALL_INTERVIEW: 'all:taas-interviews',
  // role
  READ_ROLE: 'read:taas-roles',
  CREATE_ROLE: 'create:taas-roles',
  UPDATE_ROLE: 'update:taas-roles',
  DELETE_ROLE: 'delete:taas-roles',
  ALL_ROLE: 'all:taas-roles',
  // userMeetingSettings
  READ_USER_MEETING_SETTINGS: 'read:taas-userMeetingsSettings',
  CREATE_USER_MEETING_SETTINGS: 'create:taas-userMeetingsSettings',
  UPDATE_USER_MEETING_SETTINGS: 'update:taas-userMeetingsSettings',
  ALL_USER_MEETING_SETTINGS: 'all:taas-userMeetingsSettings'

}

// Interview related constants
const Interviews = {
  Status: {
    Scheduling: 'Scheduling',
    Scheduled: 'Scheduled',
    RequestedForReschedule: 'Requested for reschedule',
    Rescheduled: 'Rescheduled',
    Completed: 'Completed',
    Cancelled: 'Cancelled',
    Expired: 'Expired'
  },
  MaxAllowedCount: 3,
  Nylas: {
    Days: {
      Monday: 'M',
      Tuesday: 'T',
      Wednesday: 'W',
      Thursday: 'R',
      Friday: 'F',
      Saturday: 'S',
      Sunday: 'U'
    },
    StartEndRegex: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  }
}

const ChallengeStatus = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  COMPLETED: 'Completed'
}

/**
 * Aggregate payment status for Work Period which is determined
 * based on the payments the Work Period has using `PaymentStatusRules`
 */
const AggregatePaymentStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in-progress',
  PARTIALLY_COMPLETED: 'partially-completed',
  COMPLETED: 'completed',
  NO_DAYS: 'no-days'
}

/**
 * `WorkPeriodPayment.status` - possible values
 */
const WorkPeriodPaymentStatus = {
  COMPLETED: 'completed',
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in-progress',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
}

/**
 * The rules how to determine WorkPeriod.paymentStatus based on the payments
 *
 * The top rule has priority over the bottom rules.
 */
const PaymentStatusRules = [
  { paymentStatus: AggregatePaymentStatus.IN_PROGRESS, condition: { hasWorkPeriodPaymentStatus: [WorkPeriodPaymentStatus.SCHEDULED, WorkPeriodPaymentStatus.IN_PROGRESS] } },
  { paymentStatus: AggregatePaymentStatus.COMPLETED, condition: { hasWorkPeriodPaymentStatus: [WorkPeriodPaymentStatus.COMPLETED], hasDueDays: false } },
  { paymentStatus: AggregatePaymentStatus.PARTIALLY_COMPLETED, condition: { hasWorkPeriodPaymentStatus: [WorkPeriodPaymentStatus.COMPLETED], hasDueDays: true } },
  { paymentStatus: AggregatePaymentStatus.PENDING, condition: { hasDueDays: true } },
  { paymentStatus: AggregatePaymentStatus.NO_DAYS, condition: { daysWorked: 0 } }
]

/**
 * The WorkPeriodPayment.status values which we take into account when calculate
 * aggregate values inside WorkPeriod:
 * - daysPaid
 * - paymentTotal
 * - paymentStatus
 */
const ActiveWorkPeriodPaymentStatuses = [
  WorkPeriodPaymentStatus.SCHEDULED,
  WorkPeriodPaymentStatus.IN_PROGRESS,
  WorkPeriodPaymentStatus.COMPLETED
]

const WorkPeriodPaymentUpdateStatus = {
  SCHEDULED: 'scheduled',
  CANCELLED: 'cancelled'
}

const PaymentProcessingSwitch = {
  ON: 'ON',
  OFF: 'OFF'
}

const WeeklySurveySwitch = {
  ON: 'ON',
  OFF: 'OFF'
}

const PaymentSchedulerStatus = {
  START_PROCESS: 'start-process',
  CREATE_CHALLENGE: 'create-challenge',
  ASSIGN_MEMBER: 'assign-member',
  ACTIVATE_CHALLENGE: 'activate-challenge',
  GET_USER_ID: 'get-userId',
  CLOSE_CHALLENGE: 'close-challenge'
}

const JobStatus = {
  OPEN: 'open'
}

const JobCandidateStatus = {
  INTERVIEW: 'interview'
}

const SearchUsers = {
  SEARCH_USERS_PAGE_SIZE: 5
}

// provider which we have to enforce for Nylas Virtual Calendars
const NylasVirtualCalendarProvider = 'nylas'

const ZoomLinkType = {
  HOST: 'host',
  GUEST: 'guest'
}

// how long to wait for the Interview Webhook Mutes to release (ms)
const InterviewEventHandlerTimeout = 60 * 1000 // 60 seconds

module.exports = {
  InterviewEventHandlerTimeout,
  UserRoles,
  FullManagePermissionRoles,
  Scopes,
  Interviews,
  ChallengeStatus,
  AggregatePaymentStatus,
  WorkPeriodPaymentStatus,
  WorkPeriodPaymentUpdateStatus,
  PaymentSchedulerStatus,
  PaymentProcessingSwitch,
  PaymentStatusRules,
  WeeklySurveySwitch,
  ActiveWorkPeriodPaymentStatuses,
  JobStatus,
  JobCandidateStatus,
  SearchUsers,
  NylasVirtualCalendarProvider,
  ZoomLinkType
}
