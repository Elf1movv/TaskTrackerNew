-- AlterTable
ALTER TABLE "user" ADD COLUMN     "categoriesSeeded" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: anyone who already has at least one category was seeded (or
-- built their own list) before this flag existed — don't reseed them.
-- Anyone with zero categories right now is indistinguishable between
-- "never seeded" and "deleted their last one" using data alone, so they
-- get the 4 defaults seeded exactly once more on their next load. This is
-- a one-time, acknowledged limitation of adding the flag after the fact —
-- see docs/BACKLOG.md.
UPDATE "user" SET "categoriesSeeded" = true WHERE id IN (SELECT DISTINCT "userId" FROM "Category");
