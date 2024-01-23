ALTER TABLE bookings.interviews
ALTER COLUMN created_by TYPE TEXT,
ALTER COLUMN updated_by TYPE TEXT;

ALTER TABLE bookings.jobs
ALTER COLUMN created_by TYPE TEXT,
ALTER COLUMN updated_by TYPE TEXT;

ALTER TABLE bookings.job_candidates
ALTER COLUMN user_id TYPE TEXT,
ALTER COLUMN created_by TYPE TEXT,
ALTER COLUMN updated_by TYPE TEXT;

ALTER TABLE bookings.resource_bookings
ALTER COLUMN user_id TYPE TEXT,
ALTER COLUMN created_by TYPE TEXT,
ALTER COLUMN updated_by TYPE TEXT;

ALTER TABLE bookings.roles
ALTER COLUMN created_by TYPE TEXT,
ALTER COLUMN updated_by TYPE TEXT;

ALTER TABLE bookings.role_search_requests
ALTER COLUMN member_id TYPE TEXT,
ALTER COLUMN created_by TYPE TEXT,
ALTER COLUMN updated_by TYPE TEXT;

ALTER TABLE bookings.roles
ALTER COLUMN created_by TYPE TEXT,
ALTER COLUMN updated_by TYPE TEXT;

ALTER TABLE bookings.user_meeting_settings
ALTER COLUMN created_by TYPE TEXT,
ALTER COLUMN updated_by TYPE TEXT;

ALTER TABLE bookings.work_periods
ALTER COLUMN created_by TYPE TEXT,
ALTER COLUMN updated_by TYPE TEXT;

ALTER TABLE bookings.work_period_payments
ALTER COLUMN created_by TYPE TEXT,
ALTER COLUMN updated_by TYPE TEXT;