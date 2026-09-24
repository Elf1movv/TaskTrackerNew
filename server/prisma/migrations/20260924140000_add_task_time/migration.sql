-- Task.time: optional "HH:mm" time-of-day for a task, same convention as
-- Reminder.time. Plain additive nullable column, no backfill needed —
-- existing tasks simply have no specific time (NULL) until edited.
ALTER TABLE "Task" ADD COLUMN "time" TEXT;
