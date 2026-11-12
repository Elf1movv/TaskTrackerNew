import { db } from "../../db.js"
import { pushMessage, type PushLanguage } from "./messages.js"
import { addDays, duePushes, toLocalNow, type DigestCounts, type ReminderForPush } from "./schedule.js"
import { pushConfigured, sendToSubscriptions } from "./sender.js"

// Once a minute: for everyone with notifications on, work out what is due in
// their time zone (schedule.ts) and send it. One server process runs this, so
// a plain timer is enough; PushSent makes it safe across restarts.

const CHECK_MS = 60_000
const KEEP_SENT_DAYS = 7

const day = (date: Date) => date.toISOString().slice(0, 10)
const asDbDate = (date: string) => new Date(`${date}T00:00:00Z`)

async function digestCounts(userId: string, today: string): Promise<DigestCounts> {
  const todayDate = asDbDate(today)
  const weekday = todayDate.getUTCDay() // 0 = Sunday, like Habit.activeDays
  const [tasksDueToday, tasksOverdue, habits, remindersToday] = await Promise.all([
    db.task.count({ where: { userId, completed: false, dueDate: todayDate } }),
    db.task.count({ where: { userId, completed: false, dueDate: { lt: todayDate } } }),
    db.habit.findMany({ where: { userId }, select: { activeDays: true } }),
    db.reminder.count({ where: { userId, completed: false, date: todayDate } }),
  ])
  return {
    tasksDueToday,
    tasksOverdue,
    habitsToday: habits.filter(h => h.activeDays.includes(weekday)).length,
    remindersToday,
  }
}

export async function runPushCheck(now = new Date()): Promise<number> {
  if (!pushConfigured()) return 0
  const users = await db.user.findMany({
    where: { timeZone: { not: null }, pushSubscriptions: { some: {} } },
    select: {
      id: true,
      timeZone: true,
      notifyTime: true,
      notifyDigest: true,
      pushSubscriptions: { select: { id: true, endpoint: true, p256dh: true, auth: true, language: true } },
    },
  })

  let sentCount = 0
  for (const user of users) {
    try {
      const local = toLocalNow(now, user.timeZone!)
      // Yesterday..in two days covers every window (24 h ahead, 15 min back).
      const rows = await db.reminder.findMany({
        where: {
          userId: user.id,
          completed: false,
          date: { gte: asDbDate(addDays(local.date, -1)), lte: asDbDate(addDays(local.date, 2)) },
        },
        select: { id: true, title: true, date: true, time: true, priority: true, completed: true },
      })
      const reminders: ReminderForPush[] = rows.map(r => ({ ...r, date: day(r.date) }))
      const digest = user.notifyDigest ? await digestCounts(user.id, local.date) : null
      const sentRows = await db.pushSent.findMany({
        where: { userId: user.id, sentAt: { gte: new Date(now.getTime() - 3 * 86_400_000) } },
        select: { key: true },
      })
      const events = duePushes({
        local,
        notifyTime: user.notifyTime,
        notifyDigest: user.notifyDigest,
        reminders,
        digest,
        sent: new Set(sentRows.map(r => r.key)),
      })

      for (const event of events) {
        // Devices may differ in language; group them so each gets its own text.
        const byLanguage = new Map<PushLanguage, typeof user.pushSubscriptions>()
        for (const sub of user.pushSubscriptions) {
          const language: PushLanguage = sub.language === "en" ? "en" : "ru"
          byLanguage.set(language, [...(byLanguage.get(language) ?? []), sub])
        }
        let anyFinal = false
        for (const [language, subs] of byLanguage) {
          const result = await sendToSubscriptions(subs, pushMessage(event, language), {
            urgent: event.kind !== "digest",
          })
          if (result !== "failed") anyFinal = true
        }
        // A temporary failure everywhere → leave it unsent, the next minute
        // tries again while the window lasts.
        if (anyFinal) {
          await db.pushSent.createMany({ data: [{ userId: user.id, key: event.key }], skipDuplicates: true })
          sentCount++
        }
      }
    } catch (err) {
      console.error("Push check failed for a user", (err as Error).message)
    }
  }
  return sentCount
}

let timer: NodeJS.Timeout | null = null
let running = false
let checks = 0

export function startPushScheduler() {
  if (timer || !pushConfigured()) {
    if (!pushConfigured()) console.log("Push notifications are off (no VAPID keys)")
    return
  }
  const tick = async () => {
    if (running) return // a slow check never overlaps the next one
    running = true
    try {
      await runPushCheck()
      if (++checks % 60 === 0) {
        await db.pushSent.deleteMany({
          where: { sentAt: { lt: new Date(Date.now() - KEEP_SENT_DAYS * 86_400_000) } },
        })
      }
    } catch (err) {
      console.error("Push check failed", (err as Error).message)
    } finally {
      running = false
    }
  }
  timer = setInterval(tick, CHECK_MS)
  console.log("Push notifications: checking every minute")
}
