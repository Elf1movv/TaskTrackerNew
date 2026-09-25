-- Category.color: drives the pastel fill of that category's task blocks on
-- the calendar (Day/Week/Month). Existing rows get a default backfill
-- color; new rows always supply their own via the client's color picker,
-- same convention as HabitGroup.color, so the DB-level default is dropped
-- right after backfilling.
ALTER TABLE "Category" ADD COLUMN "color" TEXT NOT NULL DEFAULT '#c97b3a';
ALTER TABLE "Category" ALTER COLUMN "color" DROP DEFAULT;
