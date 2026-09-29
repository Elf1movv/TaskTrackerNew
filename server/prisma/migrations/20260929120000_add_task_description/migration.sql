-- Task.description: optional free-text notes, same nullable-additive
-- convention as Task.endTime — existing rows have no value.
ALTER TABLE "Task" ADD COLUMN "description" TEXT;
