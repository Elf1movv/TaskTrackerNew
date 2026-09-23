-- Hand-written, not a raw `prisma migrate diff` output — existing Habit
-- rows need a real groupId backfilled before that column can become
-- NOT NULL, which a schema-only diff can't express (same reasoning as
-- the earlier hand-written Task.dueDate migration).

-- 1. HabitGroup table
CREATE TABLE "HabitGroup" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "isGeneral" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "HabitGroup_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HabitGroup_order_idx" ON "HabitGroup"("order");
CREATE INDEX "HabitGroup_userId_idx" ON "HabitGroup"("userId");

ALTER TABLE "HabitGroup" ADD CONSTRAINT "HabitGroup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 2. User.habitGroupsSeeded
ALTER TABLE "user" ADD COLUMN "habitGroupsSeeded" BOOLEAN NOT NULL DEFAULT false;

-- 3. Habit.groupId — nullable for now, backfilled below before the
-- NOT NULL constraint is added.
ALTER TABLE "Habit" ADD COLUMN "groupId" TEXT;

-- 4. One "General" HabitGroup per user who already has at least one
-- habit — order 999999 so it sorts last by default (still draggable).
INSERT INTO "HabitGroup" (id, title, icon, "isGeneral", "order", "updatedAt", "userId")
SELECT gen_random_uuid(), 'General', '📋', true, 999999, CURRENT_TIMESTAMP, u.id
FROM "user" u
WHERE EXISTS (SELECT 1 FROM "Habit" h WHERE h."userId" = u.id);

UPDATE "user"
SET "habitGroupsSeeded" = true
WHERE id IN (SELECT DISTINCT "userId" FROM "Habit");

-- 5. Backfill every existing habit onto its owner's new General group.
UPDATE "Habit" h
SET "groupId" = g.id
FROM "HabitGroup" g
WHERE g."userId" = h."userId" AND g."isGeneral" = true;

-- 6. Now safe to enforce NOT NULL + the real FK/index.
ALTER TABLE "Habit" ALTER COLUMN "groupId" SET NOT NULL;
CREATE INDEX "Habit_groupId_idx" ON "Habit"("groupId");
ALTER TABLE "Habit" ADD CONSTRAINT "Habit_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "HabitGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
