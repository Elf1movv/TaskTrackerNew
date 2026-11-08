-- Iteration 3 (2026-11-08): notes become undated quick records — a dated
-- note duplicated what a Reminder already does. The Note table only exists
-- on staging so far (it was added by the unreleased 20261002 migration).
ALTER TABLE "Note" DROP COLUMN "showFrom";

-- Goal.category: optional life area shared with tasks, same nullable
-- plain-string convention as Task.category. Existing goals have none.
ALTER TABLE "Goal" ADD COLUMN "category" TEXT;
