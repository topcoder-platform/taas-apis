#!/bin/bash

dump_tables:
	@echo "make sure you checked in all your changes and press a key"
	@read
	@echo "going to dev"
	git checkout dev
	npm run services:down
	npm run services:up
	npm run init-db
	npm run migrate
	@echo "cool, we are now migrated to dev status... moving on to our branch"
	git checkout feature/interview-nylas
	npm run migrate
	@echo "now we are post-feature migration state, let's dump the tables"
	@mkdir -p ./.comparisons/migrate
	@mkdir -p ./.comparisons/initdb
	docker exec -t tc-taas-postgres pg_dump -h localhost --username=postgres -t 'bookings.interviews' --schema-only postgres > ./.comparisons/migrate/interviews.sql
	docker exec -t tc-taas-postgres pg_dump -h localhost --username=postgres -t 'bookings.job_candidates' --schema-only postgres > ./.comparisons/migrate/job_candidates.sql
	docker exec -t tc-taas-postgres pg_dump -h localhost --username=postgres -t 'bookings.user_meeting_settings' --schema-only postgres > ./.comparisons/migrate/user_meeting_settings.sql
	@echo "now we revert and simply init db from the feature branch"
	npm run services:down
	npm run services:up
	npm run init-db
	docker exec -t tc-taas-postgres pg_dump -h localhost --username=postgres -t 'bookings.interviews' --schema-only postgres > ./.comparisons/init-db/interviews.sql
	docker exec -t tc-taas-postgres pg_dump -h localhost --username=postgres -t 'bookings.job_candidates' --schema-only postgres > ./.comparisons/init-db/job_candidates.sql
	docker exec -t tc-taas-postgres pg_dump -h localhost --username=postgres -t 'bookings.user_meeting_settings' --schema-only postgres > ./.comparisons/init-db/user_meeting_settings.sql
	@echo "All done, you can now compare the files"
	git diff --no-index ./.comparisons/migrate/interviews.sql ./.comparisons/init-db/interviews.sql
	git diff --no-index ./.comparisons/migrate/job_candidates.sql ./.comparisons/init-db/job_candidates.sql
	git diff --no-index ./.comparisons/migrate/user_meeting_settings.sql ./.comparisons/init-db/user_meeting_settings.sql