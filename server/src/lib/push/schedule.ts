// When to send what (push notifications, 2026-11-12). Pure functions — no
// database, no network — so every rule here is covered by schedule.test.ts.
//
// Reminder times are stored as the person's local "HH:mm" with no time zone.
// The server runs in UTC, so each check first turns "now" into the person's
// local date and minute of the day (their IANA zone, e.g. "Europe/Kyiv").

export interface LocalNow {
  date: string // "yyyy-MM-dd"
  minutes: number // minutes since local midnight, 0..1439
}

export interface ReminderForPush {
  id: string
  title: string
  date: string // "yyyy-MM-dd"
  time: string | null // "HH:mm" or null = the whole day
  priority: string // "normal" | "critical"
  completed: boolean
}

export interface DigestCounts {
  tasksDueToday: number
  tasksOverdue: number
  habitsToday: number
  remindersToday: number
}

export type PushEvent =
  | { key: string; kind: "at" | "day"; reminder: ReminderForPush }
  | { key: string; kind: "24h" | "1h"; reminder: ReminderForPush; dayOffset: number }
  | { key: string; kind: "digest"; counts: DigestCounts }

// A restart or a slow check can skip a minute; within these windows an
// unsent notification still goes out instead of being lost.
export const AT_WINDOW_MINUTES = 15
export const MORNING_WINDOW_MINUTES = 30

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone })
    return true
  } catch {
    return false
  }
}

export function toLocalNow(now: Date, timeZone: string): LocalNow {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now)
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? "00"
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  }
}

export function parseMinutes(hhmm: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(hhmm)
  if (!match) return null
  const h = Number(match[1])
  const m = Number(match[2])
  return h < 24 && m < 60 ? h * 60 + m : null
}

// Whole days from `from` to `to` ("yyyy-MM-dd"), both read as calendar days.
export function dayDiff(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000)
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

// Everything that should go out for one person right now and hasn't yet.
// `sent` holds the keys already in PushSent.
export function duePushes({
  local,
  notifyTime,
  notifyDigest,
  reminders,
  digest,
  sent,
}: {
  local: LocalNow
  notifyTime: string
  notifyDigest: boolean
  reminders: ReminderForPush[]
  digest: DigestCounts | null
  sent: Set<string>
}): PushEvent[] {
  const events: PushEvent[] = []
  const morning = parseMinutes(notifyTime) ?? 9 * 60
  const inMorningWindow = local.minutes >= morning && local.minutes < morning + MORNING_WINDOW_MINUTES

  for (const reminder of reminders) {
    if (reminder.completed) continue
    const critical = reminder.priority === "critical"
    const target = reminder.time ? parseMinutes(reminder.time) : null

    if (target === null) {
      // No time — once, at the person's morning time on that day.
      const key = `reminder:${reminder.id}:day`
      if (reminder.date === local.date && inMorningWindow && !sent.has(key)) {
        events.push({ key, kind: "day", reminder })
      }
      continue
    }

    const dayOffset = dayDiff(local.date, reminder.date)
    const minutesUntil = dayOffset * 1440 + target - local.minutes

    const atKey = `reminder:${reminder.id}:at`
    if (minutesUntil <= 0 && minutesUntil > -AT_WINDOW_MINUTES && !sent.has(atKey)) {
      events.push({ key: atKey, kind: "at", reminder })
    }
    if (critical && minutesUntil > 0) {
      // Like the in-app alert: once inside 24 h, once inside 1 h. A reminder
      // created 30 min ahead gets only the 1 h one (the closer one wins).
      const oneHourKey = `reminder:${reminder.id}:1h`
      const dayKey = `reminder:${reminder.id}:24h`
      if (minutesUntil <= 60) {
        if (!sent.has(oneHourKey)) events.push({ key: oneHourKey, kind: "1h", reminder, dayOffset })
      } else if (minutesUntil <= 1440 && !sent.has(dayKey)) {
        events.push({ key: dayKey, kind: "24h", reminder, dayOffset })
      }
    }
  }

  const digestKey = `digest:${local.date}`
  if (notifyDigest && digest && inMorningWindow && !sent.has(digestKey)) {
    const total = digest.tasksDueToday + digest.tasksOverdue + digest.habitsToday + digest.remindersToday
    if (total > 0) events.push({ key: digestKey, kind: "digest", counts: digest })
  }

  return events
}
