-- Habit.todayOrder: a second, independent ordering column, alongside the
-- existing `order`. `order` positions a habit within its group on the
-- /habits page; `todayOrder` positions it within the same group's card on
-- the Today page. Backfilled from the existing `order` value (a reasonable
-- starting point, since the two are identical until someone drags on one
-- screen or the other).
ALTER TABLE "Habit" ADD COLUMN "todayOrder" INTEGER;
UPDATE "Habit" SET "todayOrder" = "order";
ALTER TABLE "Habit" ALTER COLUMN "todayOrder" SET NOT NULL;
CREATE INDEX "Habit_todayOrder_idx" ON "Habit"("todayOrder");

-- HabitGroup.color: only used by the Today page's pill-shaped block header
-- (see schema.prisma). Existing rows (including already-seeded "General"
-- groups) get a default backfill color; new rows always supply their own
-- via the client's color picker, same convention as Habit.color, so the
-- DB-level default is dropped right after backfilling.
ALTER TABLE "HabitGroup" ADD COLUMN "color" TEXT NOT NULL DEFAULT '#c97b3a';
ALTER TABLE "HabitGroup" ALTER COLUMN "color" DROP DEFAULT;
