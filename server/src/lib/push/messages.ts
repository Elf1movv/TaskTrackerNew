import type { DigestCounts, PushEvent } from "./schedule.js"

// The text of each notification, in the language the person had when they
// turned notifications on. Kept short: a phone shows ~2 lines.

export type PushLanguage = "ru" | "en"

export interface PushMessage {
  title: string
  body: string
  tag: string // a newer notification with the same tag replaces the older one
  url: string // opened on tap
}

// Russian plural: 1 задача, 2 задачи, 5 задач.
function ruPlural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}

function enPlural(n: number, one: string, many: string): string {
  return n === 1 ? one : many
}

function dayLabel(dayOffset: number, date: string, language: PushLanguage): string {
  if (dayOffset === 0) return language === "ru" ? "сегодня" : "today"
  if (dayOffset === 1) return language === "ru" ? "завтра" : "tomorrow"
  const [, month, day] = date.split("-")
  return language === "ru" ? `${day}.${month}` : `${month}/${day}`
}

function digestBody(counts: DigestCounts, language: PushLanguage): string {
  const parts: string[] = []
  const { tasksDueToday: due, tasksOverdue: overdue, habitsToday: habits, remindersToday: reminders } = counts
  if (language === "ru") {
    if (due) parts.push(`${due} ${ruPlural(due, "задача", "задачи", "задач")} со сроком сегодня`)
    if (overdue) parts.push(`${overdue} ${ruPlural(overdue, "просрочена", "просрочены", "просрочено")}`)
    if (habits) parts.push(`${habits} ${ruPlural(habits, "привычка", "привычки", "привычек")}`)
    if (reminders)
      parts.push(`${reminders} ${ruPlural(reminders, "напоминание", "напоминания", "напоминаний")}`)
  } else {
    if (due) parts.push(`${due} ${enPlural(due, "task", "tasks")} due today`)
    if (overdue) parts.push(`${overdue} overdue`)
    if (habits) parts.push(`${habits} ${enPlural(habits, "habit", "habits")}`)
    if (reminders) parts.push(`${reminders} ${enPlural(reminders, "reminder", "reminders")}`)
  }
  return parts.join(" · ")
}

export function pushMessage(event: PushEvent, language: PushLanguage): PushMessage {
  const ru = language === "ru"
  if (event.kind === "digest") {
    return {
      title: ru ? "План на сегодня" : "Today's plan",
      body: digestBody(event.counts, language),
      tag: event.key,
      url: "/today",
    }
  }
  const { reminder } = event
  const critical = reminder.priority === "critical"
  const label = critical ? (ru ? "Важное" : "Important") : ru ? "Напоминание" : "Reminder"
  let body: string
  switch (event.kind) {
    case "at":
      body = `${label} · ${reminder.time}`
      break
    case "day":
      body = ru ? `${label} на сегодня` : `${label} for today`
      break
    case "24h":
    case "1h":
      body = `${label} · ${dayLabel(event.dayOffset, reminder.date, language)} ${ru ? "в" : "at"} ${reminder.time}`
      break
  }
  // One tag per reminder: the "in 1 hour" notice is replaced by the
  // "it's time" one instead of piling up.
  return { title: reminder.title, body, tag: `reminder:${reminder.id}`, url: "/today" }
}

export function testMessage(language: PushLanguage): PushMessage {
  return language === "ru"
    ? { title: "MyTracker", body: "Уведомления работают 👍", tag: "test", url: "/today" }
    : { title: "MyTracker", body: "Notifications are working 👍", tag: "test", url: "/today" }
}
