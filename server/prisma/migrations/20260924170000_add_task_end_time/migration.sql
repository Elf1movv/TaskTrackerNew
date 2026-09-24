-- Task.endTime: optional "HH:mm" end of a task's timed block on the
-- Day/Week calendar timeline, same convention as Task.time. Plain
-- additive nullable column, no backfill needed.
ALTER TABLE "Task" ADD COLUMN "endTime" TEXT;
