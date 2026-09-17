-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "completedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE INDEX "Category_order_idx" ON "Category"("order");

-- Seed the categories that existed as a hardcoded list before this table
-- existed, so users don't start with an empty category picker.
INSERT INTO "Category" ("id", "name", "order", "updatedAt") VALUES
  (gen_random_uuid()::text, 'Work', 0, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Personal', 1, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Health', 2, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Learning', 3, CURRENT_TIMESTAMP);
