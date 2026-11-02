// Read-only staging audit: prints counts and content hashes, never record text.
import { PrismaClient } from "@prisma/client"
import { createHash } from "node:crypto"
const url = new URL(process.env.DATABASE_URL ?? "")
if (url.pathname !== "/tasktracker_stage" || process.env.AUTH_COOKIE_PREFIX !== "mytracker-staging")
  throw Error("Staging database required")
const db = new PrismaClient()
function canonical(value) {
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map(key => [key, canonical(value[key])]),
    )
  return value
}
function fingerprint(items) {
  return {
    count: items.length,
    sha256: createHash("sha256")
      .update(JSON.stringify(canonical(items.sort((a, b) => a.id.localeCompare(b.id)))))
      .digest("hex"),
  }
}
try {
  const [users, notes, tasks, goals, plans, reminders] = await Promise.all([
    db.user.findMany({ select: { id: true, emailVerified: true } }),
    db.note.findMany(),
    db.task.findMany(),
    db.goal.findMany(),
    db.calendarPlan.findMany({ include: { task: true } }),
    db.reminder.findMany(),
  ])
  const fieldsWithout = (item, keys) =>
    Object.fromEntries(Object.entries(item).filter(([key]) => !keys.includes(key)))
  console.log(
    JSON.stringify({
      links: {
        goalTasks: tasks.filter(t => t.goalId).length,
        plans: plans.filter(p => p.taskId).length,
        reminders: reminders.filter(r => r.taskId || r.planId).length,
      },
      data: {
        users: fingerprint(users),
        notes: fingerprint(notes.map(n => ({ ...n, completed: n.completed ?? false }))),
        tasks: fingerprint(tasks.map(t => fieldsWithout(t, ["goalId", "updatedAt"]))),
        goals: fingerprint(goals.map(g => fieldsWithout(g, ["achievedAt", "progress", "updatedAt"]))),
        plans: fingerprint(
          plans.map(p =>
            fieldsWithout(
              {
                ...p,
                ...(p.task
                  ? {
                      title: p.task.title,
                      description: p.task.description,
                      completed: p.task.completed,
                      priority: p.task.priority,
                      category: p.task.category,
                    }
                  : {}),
              },
              ["task", "taskId", "updatedAt"],
            ),
          ),
        ),
        reminders: fingerprint(
          reminders.map(r =>
            fieldsWithout({ ...r, completed: r.completed || r.suspended, suspended: false }, [
              "taskId",
              "planId",
              "offsetMinutes",
              "updatedAt",
            ]),
          ),
        ),
      },
    }),
  )
} finally {
  await db.$disconnect()
}
