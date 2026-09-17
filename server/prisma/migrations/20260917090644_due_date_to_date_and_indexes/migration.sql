-- AlterTable
-- Manually adjusted from Prisma's default drop+recreate (which would have
-- destroyed existing dueDate values) to an explicit cast that converts the
-- existing "YYYY-MM-DD" text values in place — verified against production
-- data on 2026-09-17 that every stored value already matches that format.
ALTER TABLE "Task" ALTER COLUMN "dueDate" TYPE DATE USING "dueDate"::date;

-- CreateIndex
CREATE INDEX "Goal_order_idx" ON "Goal"("order");

-- CreateIndex
CREATE INDEX "Habit_order_idx" ON "Habit"("order");

-- CreateIndex
CREATE INDEX "Task_order_idx" ON "Task"("order");

-- CreateIndex
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");
