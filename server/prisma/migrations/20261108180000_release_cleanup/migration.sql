-- Release cleanup before the redesign ships to production (2026-11-08).
--
-- Owner decision: every existing task stays a task. The one-time manual
-- review panel (decision 17, Oct 2026) is dropped — production has other
-- users, and hiding all their tasks until they sort them was too disruptive.
--
-- Only columns that the current production code (eaf417d) does not know
-- about are dropped here, so the old code can still run against this schema
-- in an emergency. Task.time/endTime and CalendarPlan.priority/category go
-- in a later release.
BEGIN;

-- 1. Journal of originals: a full copy of every old task before it stops
-- being "pending review". Their old hour (time/endTime) is no longer shown
-- anywhere; this is where it can be recovered from by hand.
INSERT INTO "LegacyTransition" ("id", "sourceKey", "choice", "snapshot", "resultId", "userId")
SELECT gen_random_uuid()::text, 'release:task:' || t."id", 'kept-task', to_jsonb(t), t."id", t."userId"
FROM "Task" t WHERE t."legacyPending"
ON CONFLICT ("userId", "sourceKey") DO NOTHING;

-- 2. Tasks the old review panel already turned into a note or a plan were
-- only hidden (retiredAt). Their originals are in the journal (written by
-- the panel), and the note/plan they became exists, so remove the hidden
-- duplicate instead of letting it reappear as a task. Staging only: on
-- production nobody could have used the panel yet.
DELETE FROM "Task" WHERE "retiredAt" IS NOT NULL;

-- 3. Leftover links from the experimental first redesign. Their values were
-- copied into the journal and cleared by 20261010120000_independent_entities.
ALTER TABLE "Task" DROP CONSTRAINT IF EXISTS "Task_independent_goal";
ALTER TABLE "Task" DROP COLUMN "goalId", DROP COLUMN "legacyPending", DROP COLUMN "retiredAt";

ALTER TABLE "CalendarPlan" DROP CONSTRAINT IF EXISTS "CalendarPlan_independent_task";
ALTER TABLE "CalendarPlan" DROP COLUMN "taskId";

ALTER TABLE "Reminder" DROP CONSTRAINT IF EXISTS "Reminder_independent_target";
ALTER TABLE "Reminder" DROP COLUMN "taskId", DROP COLUMN "planId", DROP COLUMN "offsetMinutes", DROP COLUMN "suspended";

ALTER TABLE "Goal" DROP COLUMN "achievedAt";

COMMIT;
