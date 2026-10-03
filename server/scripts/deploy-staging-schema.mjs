import { PrismaClient } from "@prisma/client"
import { spawnSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const database = new URL(process.env.DATABASE_URL ?? "")
const stage =
  process.env.AUTH_COOKIE_PREFIX === "mytracker-staging" && database.pathname === "/tasktracker_stage"
const browser =
  database.pathname === "/tasktracker_test" && database.searchParams.get("schema") === "redesign_browser"
if (!stage && !browser) throw new Error("This bootstrap is restricted to isolated staging/browser storage")
const prisma = (...args) =>
  spawnSync(process.execPath, [path.join(root, "node_modules/prisma/build/index.js"), ...args], {
    cwd: root,
    env: process.env,
    stdio: "inherit",
  }).status
if (prisma("migrate", "deploy") === 0) process.exit(0)
// Historical migrations seeded four ownerless category names before
// requiring userId. Existing installations assigned them manually. On a
// brand-new isolated DB ONLY, discard just those known seed rows. Never
// rewrite a published migration or apply this repair to existing accounts.
const db = new PrismaClient()
try {
  const failures =
    await db.$queryRaw`SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NULL AND rolled_back_at IS NULL`
  if (failures.length !== 1 || failures[0].migration_name !== "20260919075427_require_user_id")
    throw new Error("Unexpected failed migration; no automatic repair performed")
  await db.$transaction(async tx => {
    const [counts] =
      await tx.$queryRaw`SELECT (SELECT count(*) FROM "user")::int AS users, (SELECT count(*) FROM "Task")::int AS tasks, (SELECT count(*) FROM "Goal")::int AS goals, (SELECT count(*) FROM "Habit")::int AS habits`
    if (Object.values(counts).some(count => count !== 0))
      throw new Error("Database contains user data; refusing seed repair")
    const categories = await tx.$queryRaw`SELECT name, "userId", "order" FROM "Category" ORDER BY "order"`
    const seeds = ["Work", "Personal", "Health", "Learning"]
    if (
      categories.length !== 4 ||
      categories.some(
        (item, index) => item.name !== seeds[index] || item.userId !== null || item.order !== index,
      )
    )
      throw new Error("Unexpected category data; refusing seed repair")
    await tx.$executeRaw`DELETE FROM "Category" WHERE "userId" IS NULL AND name IN ('Work','Personal','Health','Learning')`
  })
} finally {
  await db.$disconnect()
}
if (prisma("migrate", "resolve", "--rolled-back", "20260919075427_require_user_id") !== 0) process.exit(1)
process.exit(prisma("migrate", "deploy") ?? 1)
