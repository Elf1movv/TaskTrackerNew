-- Audit batch 4 (2026-11-09): one habit order, schema cleanup, and the day a
-- reminder was checked.
--
-- After this the previous release's code no longer runs against the schema
-- (it reads the dropped columns) — roll back by restoring the pre-release
-- dump, not by redeploying old code.
BEGIN;

-- 1. Reminder.completedAt: when a reminder was checked. Today and the bell
-- show a checked reminder until the end of that day. For reminders already
-- checked, their last change is the best available guess.
ALTER TABLE "Reminder" ADD COLUMN "completedAt" TIMESTAMP(3);
UPDATE "Reminder" SET "completedAt" = "updatedAt" WHERE "completed";

-- 2. One habit order for Today and Habits (decision 4): the Habits page's
-- `order` becomes the only order, Today's separate `todayOrder` goes.
DROP INDEX IF EXISTS "Habit_todayOrder_idx";
ALTER TABLE "Habit" DROP COLUMN "todayOrder";

-- 3. Tasks have no hour since the redesign. The release_cleanup migration
-- journaled every old task with its hour; journal any task that still has one
-- and was not journaled then (same sourceKey, so already-journaled tasks are
-- skipped), so nothing is lost by dropping the columns.
INSERT INTO "LegacyTransition" ("id", "sourceKey", "choice", "snapshot", "resultId", "userId")
SELECT gen_random_uuid()::text, 'release:task:' || t."id", 'kept-task', to_jsonb(t), t."id", t."userId"
FROM "Task" t WHERE t."time" IS NOT NULL OR t."endTime" IS NOT NULL
ON CONFLICT ("userId", "sourceKey") DO NOTHING;
ALTER TABLE "Task" DROP COLUMN "time", DROP COLUMN "endTime";

-- 4. Plans have no priority or category in the form; they're drawn in one
-- color since audit batch 3.
ALTER TABLE "CalendarPlan" DROP COLUMN "priority", DROP COLUMN "category";

COMMIT;
