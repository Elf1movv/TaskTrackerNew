import { readFileSync } from "node:fs"
import { expect, it } from "vitest"
import { db } from "../db.js"

// Exercise the real published candidate SQL against temporary tables. They
// shadow the application tables only on this connection and vanish at commit.
it("detaches experimental records without losing text, schedule, milestones or originals", async () => {
  const sql = readFileSync(
    new URL("../../prisma/migrations/20261010120000_independent_entities/migration.sql", import.meta.url),
    "utf8",
  )
  const statements = sql
    .replace(/^--.*$/gm, "")
    .split(";")
    .map(s => s.trim())
    .filter(s => s && s !== "BEGIN" && s !== "COMMIT")
  await db.$transaction(async tx => {
    const definitions = [
      '"Note" ("id" text, "title" text, "description" text, "archivedAt" timestamp)',
      '"Task" ("id" text, "userId" text, "goalId" text, "title" text, "description" text, "completed" boolean, "category" text, "priority" text, "updatedAt" timestamp)',
      '"Goal" ("id" text, "userId" text, "milestones" jsonb, "progress" integer, "achievedAt" timestamp, "updatedAt" timestamp)',
      '"CalendarPlan" ("id" text, "userId" text, "taskId" text, "title" text, "description" text, "completed" boolean, "category" text, "priority" text, "date" date, "time" text, "durationMinutes" integer, "onHold" boolean, "updatedAt" timestamp)',
      '"Reminder" ("id" text, "userId" text, "taskId" text, "planId" text, "offsetMinutes" integer, "completed" boolean, "suspended" boolean, "date" date, "time" text, "updatedAt" timestamp)',
      '"LegacyTransition" ("id" text, "sourceKey" text, "choice" text, "snapshot" jsonb, "resultId" text, "userId" text)',
    ]
    for (const definition of definitions)
      await tx.$executeRawUnsafe(`CREATE TEMP TABLE ${definition} ON COMMIT DROP`)
    await tx.$executeRaw`INSERT INTO "Note" VALUES ('n', 'Old note', 'Keep this text', NULL)`
    await tx.$executeRaw`INSERT INTO "Task" VALUES ('t', 'u', 'g', 'Visible title', 'Updated description', true, 'Work', 'high', NOW())`
    await tx.$executeRaw`INSERT INTO "Goal" VALUES ('g', 'u', '[{"id":"m","title":"Own step","completed":true},{"id":"m2","title":"Next step","completed":false}]'::jsonb, 100, NOW(), NOW())`
    await tx.$executeRaw`INSERT INTO "CalendarPlan" VALUES ('p', 'u', 't', 'Stale snapshot', NULL, false, '', 'medium', '2030-01-15', '14:00', 20, false, NOW())`
    await tx.$executeRaw`INSERT INTO "Reminder" VALUES ('r', 'u', NULL, 'p', 30, false, true, '2030-01-15', '13:30', NOW())`
    for (const statement of statements) await tx.$executeRawUnsafe(statement)
    const notes = await tx.$queryRaw<
      Array<{ title: string; description: string; completed: boolean }>
    >`SELECT * FROM "Note"`
    expect(notes).toMatchObject([{ title: "Old note", description: "Keep this text", completed: false }])
    const tasks = await tx.$queryRaw<Array<{ goalId: null; title: string }>>`SELECT * FROM "Task"`
    expect(tasks).toMatchObject([{ goalId: null, title: "Visible title" }])
    const plans = await tx.$queryRaw<
      Array<{
        title: string
        description: string
        time: string
        durationMinutes: number
        completed: boolean
        taskId: null
      }>
    >`SELECT * FROM "CalendarPlan"`
    expect(plans).toMatchObject([
      {
        title: "Visible title",
        description: "Updated description",
        time: "14:00",
        durationMinutes: 20,
        completed: true,
        taskId: null,
      },
    ])
    const goals = await tx.$queryRaw<
      Array<{ progress: number; milestones: unknown[]; achievedAt: null }>
    >`SELECT * FROM "Goal"`
    expect(goals[0]).toMatchObject({ progress: 50, achievedAt: null })
    expect(goals[0].milestones).toHaveLength(2)
    const reminders = await tx.$queryRaw<
      Array<{ completed: boolean; suspended: boolean; planId: null; time: string }>
    >`SELECT * FROM "Reminder"`
    expect(reminders).toMatchObject([{ completed: true, suspended: false, planId: null, time: "13:30" }])
    const log = await tx.$queryRaw<
      Array<{ sourceKey: string; snapshot: { goalId?: string; plan?: { title: string } } }>
    >`SELECT * FROM "LegacyTransition"`
    expect(log).toHaveLength(4)
    expect(log.find(row => row.sourceKey === "independence:task:t")?.snapshot.goalId).toBe("g")
    expect(log.find(row => row.sourceKey === "independence:plan:p")?.snapshot.plan?.title).toBe(
      "Stale snapshot",
    )
  })
})
