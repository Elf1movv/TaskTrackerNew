import { readFileSync } from "node:fs"
import { expect, it } from "vitest"
import { db } from "../db.js"

// Runs the real release-cleanup SQL against temporary tables shaped like the
// production schema at that point. They shadow the application tables only
// on this connection and vanish at commit — same approach as
// independenceMigration.test.ts.
it("keeps every old task as a task, journals its original and drops the review leftovers", async () => {
  const sql = readFileSync(
    new URL("../../prisma/migrations/20261108180000_release_cleanup/migration.sql", import.meta.url),
    "utf8",
  )
  const statements = sql
    .replace(/^--.*$/gm, "")
    .split(";")
    .map(s => s.trim())
    .filter(s => s && s !== "BEGIN" && s !== "COMMIT")
  await db.$transaction(async tx => {
    const definitions = [
      '"Task" ("id" text, "userId" text, "title" text, "time" text, "endTime" text, "goalId" text, "legacyPending" boolean, "retiredAt" timestamp)',
      '"CalendarPlan" ("id" text, "taskId" text)',
      '"Reminder" ("id" text, "taskId" text, "planId" text, "offsetMinutes" integer, "suspended" boolean)',
      '"Goal" ("id" text, "achievedAt" timestamp)',
      '"LegacyTransition" ("id" text, "sourceKey" text, "choice" text, "snapshot" jsonb, "resultId" text, "userId" text, UNIQUE ("userId", "sourceKey"))',
    ]
    for (const definition of definitions)
      await tx.$executeRawUnsafe(`CREATE TEMP TABLE ${definition} ON COMMIT DROP`)
    // An old production task with an hour, an old one without, a new one
    // created after the redesign, and a staging task the old review panel
    // already turned into a note (hidden, original already journaled).
    await tx.$executeRaw`INSERT INTO "Task" VALUES
      ('old-timed', 'u', 'Doctor', '15:00', '16:00', NULL, true, NULL),
      ('old-plain', 'u', 'Buy milk', NULL, NULL, NULL, true, NULL),
      ('new', 'u', 'Fresh task', NULL, NULL, NULL, false, NULL),
      ('retired', 'u', 'Became a note', NULL, NULL, NULL, false, NOW())`
    await tx.$executeRaw`INSERT INTO "LegacyTransition" VALUES
      ('l0', 'task:retired', 'note', '{"title":"Became a note"}'::jsonb, 'note-1', 'u')`
    for (const statement of statements) await tx.$executeRawUnsafe(statement)

    const tasks = await tx.$queryRaw<Array<Record<string, unknown>>>`SELECT * FROM "Task" ORDER BY "id"`
    expect(tasks.map(t => t.id)).toEqual(["new", "old-plain", "old-timed"])
    expect(Object.keys(tasks[0]).sort()).toEqual(["endTime", "id", "time", "title", "userId"])

    const journal = await tx.$queryRaw<
      Array<{ sourceKey: string; choice: string; snapshot: { time?: string; endTime?: string } }>
    >`SELECT "sourceKey", "choice", "snapshot" FROM "LegacyTransition" ORDER BY "sourceKey"`
    expect(journal.map(row => row.sourceKey)).toEqual([
      "release:task:old-plain",
      "release:task:old-timed",
      "task:retired",
    ])
    const timed = journal.find(row => row.sourceKey === "release:task:old-timed")
    expect(timed).toMatchObject({ choice: "kept-task", snapshot: { time: "15:00", endTime: "16:00" } })

    const plan = await tx.$queryRaw<Array<Record<string, unknown>>>`SELECT * FROM "CalendarPlan"`
    expect(plan).toEqual([])
    const reminderColumns = await tx.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'Reminder' AND table_schema LIKE 'pg_temp%'`
    expect(reminderColumns.map(c => c.column_name)).toEqual(["id"])
  })
})
