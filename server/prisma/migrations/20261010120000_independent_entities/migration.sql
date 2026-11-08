BEGIN;

ALTER TABLE "Note" ADD COLUMN "completed" BOOLEAN NOT NULL DEFAULT false;

-- Keep full originals before removing experimental relationships. No user
-- records are deleted. Existing converted milestones stay as ordinary tasks;
-- their original goal/milestone is also preserved in the earlier journal.
INSERT INTO "LegacyTransition" ("id", "sourceKey", "choice", "snapshot", "resultId", "userId")
SELECT gen_random_uuid()::text, 'independence:task:' || t."id", 'independent-task', to_jsonb(t), t."id", t."userId"
FROM "Task" t WHERE t."goalId" IS NOT NULL;
INSERT INTO "LegacyTransition" ("id", "sourceKey", "choice", "snapshot", "resultId", "userId")
SELECT gen_random_uuid()::text, 'independence:plan:' || p."id", 'independent-plan',
 jsonb_build_object('plan', to_jsonb(p), 'task', to_jsonb(t)), p."id", p."userId"
FROM "CalendarPlan" p JOIN "Task" t ON t."id" = p."taskId";
INSERT INTO "LegacyTransition" ("id", "sourceKey", "choice", "snapshot", "resultId", "userId")
SELECT gen_random_uuid()::text, 'independence:goal:' || g."id", 'independent-goal', to_jsonb(g), g."id", g."userId"
FROM "Goal" g WHERE g."achievedAt" IS NOT NULL;
INSERT INTO "LegacyTransition" ("id", "sourceKey", "choice", "snapshot", "resultId", "userId")
SELECT gen_random_uuid()::text, 'independence:reminder:' || r."id", 'independent-reminder', to_jsonb(r), r."id", r."userId"
FROM "Reminder" r WHERE r."taskId" IS NOT NULL OR r."planId" IS NOT NULL;

-- The task supplied the visible text/status in the first iteration. Copy
-- those visible values before detaching; preserve date/time/duration/order.
UPDATE "CalendarPlan" p SET "title" = t."title", "description" = t."description",
 "completed" = t."completed", "category" = t."category", "priority" = t."priority",
 "taskId" = NULL, "updatedAt" = CURRENT_TIMESTAMP
FROM "Task" t WHERE p."taskId" = t."id";
UPDATE "Task" SET "goalId" = NULL, "updatedAt" = CURRENT_TIMESTAMP WHERE "goalId" IS NOT NULL;
UPDATE "Goal" SET "achievedAt" = NULL,
 "progress" = CASE WHEN jsonb_array_length("milestones"::jsonb) = 0 THEN 0 ELSE
 ROUND(100.0 * (SELECT COUNT(*) FROM jsonb_array_elements("milestones"::jsonb) m WHERE m->>'completed' = 'true') / jsonb_array_length("milestones"::jsonb))::integer END,
 "updatedAt" = CURRENT_TIMESTAMP;
-- Suspended signals become completed standalone reminders, keeping their
-- last date/time visible in history instead of firing an obsolete alarm.
UPDATE "Reminder" SET "taskId" = NULL, "planId" = NULL, "offsetMinutes" = NULL,
 "completed" = "completed" OR "suspended", "suspended" = false, "updatedAt" = CURRENT_TIMESTAMP
WHERE "taskId" IS NOT NULL OR "planId" IS NOT NULL;

-- An old browser/API client must not recreate the discarded relationships.
ALTER TABLE "Task" ADD CONSTRAINT "Task_independent_goal" CHECK ("goalId" IS NULL);
ALTER TABLE "CalendarPlan" ADD CONSTRAINT "CalendarPlan_independent_task" CHECK ("taskId" IS NULL);
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_independent_target" CHECK ("taskId" IS NULL AND "planId" IS NULL AND "offsetMinutes" IS NULL);

COMMIT;
