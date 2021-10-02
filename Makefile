#!/bin/bash


GR=\033[92m>>>  
NC=  <<<\033[0m
.PHONY: dump_tables
dump_tables:
	@echo "${GR}make sure you checked in all your changes${NC}"
	@echo "${GR}going to dev${NC}"
	git checkout dev
	npm run services:down
	npm run services:up
	npm run init-db
	npm run migrate
	@echo "${GR}cool, we are now migrated to dev status... moving on to our branch${NC}"
	git checkout feature/interview-nylas
	npm run migrate
	@echo "${GR}now we are post-feature migration state, let's dump the tables${NC}"
	@mkdir -p ./.comparisons/migrate
	@mkdir -p ./.comparisons/init-db
	@docker exec -t tc-taas-postgres pg_dump -h localhost --username=postgres -t 'bookings.interviews' --schema-only postgres > ./.comparisons/migrate/interviews.sql
	@docker exec -t tc-taas-postgres pg_dump -h localhost --username=postgres -t 'bookings.job_candidates' --schema-only postgres > ./.comparisons/migrate/job_candidates.sql
	@docker exec -t tc-taas-postgres pg_dump -h localhost --username=postgres -t 'bookings.user_meeting_settings' --schema-only postgres > ./.comparisons/migrate/user_meeting_settings.sql
	@echo "${GR}now we revert and simply `init-db force` from the feature branch${NC}"
	npm run services:down
	npm run services:up
	npm run init-db force
	@docker exec -t tc-taas-postgres pg_dump -h localhost --username=postgres -t 'bookings.interviews' --schema-only postgres > ./.comparisons/init-db/interviews.sql
	@docker exec -t tc-taas-postgres pg_dump -h localhost --username=postgres -t 'bookings.job_candidates' --schema-only postgres > ./.comparisons/init-db/job_candidates.sql
	@docker exec -t tc-taas-postgres pg_dump -h localhost --username=postgres -t 'bookings.user_meeting_settings' --schema-only postgres > ./.comparisons/init-db/user_meeting_settings.sql
	@echo "${GR}All done, you can now compare the files${NC}" 
	git diff --no-index ./.comparisons/migrate/interviews.sql ./.comparisons/init-db/interviews.sql > ./.comparisons/interviews.diff || true
	git diff --no-index ./.comparisons/migrate/job_candidates.sql ./.comparisons/init-db/job_candidates.sql > ./.comparisons/job_candidates.diff || true
	git diff --no-index ./.comparisons/migrate/user_meeting_settings.sql ./.comparisons/init-db/user_meeting_settings.sql > ./.comparisons/user_meeting_settings.diff || true



.PHONY: reboot
reboot:
	npm run services:down	
	npm run services:up
	npm run init-db 
	npm run migrate
	npm run local:init || true
	npm run test
