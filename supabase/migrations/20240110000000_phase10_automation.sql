-- 20240110000000_phase10_automation.sql

-- Expand run_log for better execution tracking
alter table run_log
  add column status text default 'COMPLETED', -- PENDING, RUNNING, COMPLETED, PARTIAL, FAILED
  add column segment text, -- MORNING_DISCOVERY, AFTERNOON_VERIFICATION, EVENING_DIGEST
  add column source_failures jsonb default '[]'::jsonb;

-- Track source health accurately
alter table sources
  add column consecutive_failures int default 0;

-- Optional: ensure profiles table has basic preferences if it didn't
-- already handled in phase3_4 but we can ensure the structure in jsonb
-- Default automation settings
-- {
--   "automation": {
--     "morning_run_enabled": true,
--     "afternoon_run_enabled": true,
--     "evening_run_enabled": true,
--     "morning_time": "07:00",
--     "afternoon_time": "13:00",
--     "evening_time": "21:00"
--   }
-- }

-- Ensure we can index run_log status for dashboard lookups
create index if not exists idx_run_log_status on run_log(status);
create index if not exists idx_run_log_segment on run_log(segment);
