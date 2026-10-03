import { Prisma, type CalendarPlan, type Task } from "@prisma/client"
import { db } from "../db.js"
import type { Request } from "express"

export function fail(status: number, message: string): never {
  throw Object.assign(new Error(message), { status })
}

// Related writes serialize per owner, including deletion and migration.
// This prevents a new link slipping in between ownership checks and deletion.
export async function ownerTransaction<T>(
  userId: string,
  work: (tx: Prisma.TransactionClient) => Promise<T>,
) {
  return db.$transaction(async tx => {
    await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtext(${userId}))`
    return work(tx)
  })
}

export function localClock(req: Request, now = new Date()) {
  const zone = req.get("X-Time-Zone") ?? "UTC"
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(now)
    const part = (type: string) => parts.find(p => p.type === type)!.value
    return {
      date: `${part("year")}-${part("month")}-${part("day")}`,
      time: `${part("hour")}:${part("minute")}`,
    }
  } catch {
    return fail(400, "Invalid time zone")
  }
}

export function isFuture(date: Date | null, time: string | null, clock: { date: string; time: string }) {
  if (!date) return true // Held work has not happened yet.
  const day = date.toISOString().slice(0, 10)
  return day > clock.date || (day === clock.date && time !== null && time > clock.time)
}

export async function checkTask(tx: Prisma.TransactionClient, userId: string, id: string | null | undefined) {
  if (!id) return null
  const task = await tx.task.findFirst({ where: { id, userId, retiredAt: null, legacyPending: false } })
  if (!task) fail(404, "Task not found")
  return task
}

export async function checkGoal(tx: Prisma.TransactionClient, userId: string, id: string | null | undefined) {
  if (id && !(await tx.goal.findFirst({ where: { id, userId } }))) fail(404, "Goal not found")
}

export function clientPlan(plan: CalendarPlan & { task?: Task | null }) {
  const { task } = plan
  return {
    id: plan.id,
    time: plan.time,
    endTime: plan.endTime,
    durationMinutes: plan.durationMinutes,
    onHold: plan.onHold,
    taskId: plan.taskId,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
    date: plan.date?.toISOString().slice(0, 10) ?? null,
    title: task?.title ?? plan.title,
    description: task ? task.description : plan.description,
    completed: task?.completed ?? plan.completed,
    priority: task?.priority ?? plan.priority,
    category: task?.category ?? plan.category,
  }
}

export async function refreshPlanReminders(tx: Prisma.TransactionClient, plan: CalendarPlan) {
  const reminders = await tx.reminder.findMany({ where: { planId: plan.id, offsetMinutes: { not: null } } })
  for (const reminder of reminders) {
    if (plan.onHold || !plan.date || !plan.time) {
      await tx.reminder.update({ where: { id: reminder.id }, data: { suspended: true } })
    } else {
      const instant = new Date(`${plan.date.toISOString().slice(0, 10)}T${plan.time}:00Z`)
      instant.setUTCMinutes(instant.getUTCMinutes() - reminder.offsetMinutes!)
      await tx.reminder.update({
        where: { id: reminder.id },
        data: {
          date: new Date(instant.toISOString().slice(0, 10)),
          time: instant.toISOString().slice(11, 16),
          suspended: false,
        },
      })
    }
  }
}

export async function removeTask(
  tx: Prisma.TransactionClient,
  task: Task,
  clock: { date: string; time: string },
) {
  const plans = await tx.calendarPlan.findMany({ where: { taskId: task.id, userId: task.userId } })
  for (const plan of plans) {
    if (isFuture(plan.date, plan.time, clock)) {
      await tx.calendarPlan.delete({ where: { id: plan.id } })
    } else {
      await tx.calendarPlan.update({
        where: { id: plan.id },
        data: {
          taskId: null,
          title: task.title,
          description: task.description,
          completed: task.completed,
          category: task.category,
          priority: task.priority,
        },
      })
    }
  }
  const reminders = await tx.reminder.findMany({ where: { taskId: task.id, userId: task.userId } })
  for (const reminder of reminders) {
    if (isFuture(reminder.date, reminder.time, clock))
      await tx.reminder.delete({ where: { id: reminder.id } })
  }
  await tx.task.delete({ where: { id: task.id } })
}
