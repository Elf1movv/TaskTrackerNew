import { describe, expect, it } from "vitest"
import { pushMessage } from "./messages.js"
import { duePushes, toLocalNow, type ReminderForPush } from "./schedule.js"

const reminder = (over: Partial<ReminderForPush> = {}): ReminderForPush => ({
  id: "r1",
  title: "Позвонить маме",
  date: "2026-11-12",
  time: "14:30",
  priority: "normal",
  completed: false,
  ...over,
})

const run = (
  localDate: string,
  hhmm: string,
  reminders: ReminderForPush[],
  sent: string[] = [],
  extra = {},
) => {
  const [h, m] = hhmm.split(":").map(Number)
  return duePushes({
    local: { date: localDate, minutes: h * 60 + m },
    notifyTime: "09:00",
    notifyDigest: true,
    reminders,
    digest: null,
    sent: new Set(sent),
    ...extra,
  })
}

describe("toLocalNow", () => {
  it("turns UTC into the person's local date and minute", () => {
    // 22:30 UTC on the 12th = 00:30 on the 13th in Kyiv (UTC+2 in November).
    expect(toLocalNow(new Date("2026-11-12T22:30:00Z"), "Europe/Kyiv")).toEqual({
      date: "2026-11-13",
      minutes: 30,
    })
    expect(toLocalNow(new Date("2026-11-12T22:30:00Z"), "America/New_York")).toEqual({
      date: "2026-11-12",
      minutes: 17 * 60 + 30,
    })
  })
})

describe("duePushes — reminders", () => {
  it("sends a timed reminder at its time, once", () => {
    expect(run("2026-11-12", "14:29", [reminder()])).toEqual([])
    expect(run("2026-11-12", "14:30", [reminder()]).map(e => e.key)).toEqual(["reminder:r1:at"])
    expect(run("2026-11-12", "14:31", [reminder()], ["reminder:r1:at"])).toEqual([])
  })

  it("still sends within 15 minutes after a missed check, not later", () => {
    expect(run("2026-11-12", "14:44", [reminder()]).map(e => e.key)).toEqual(["reminder:r1:at"])
    expect(run("2026-11-12", "14:45", [reminder()])).toEqual([])
  })

  it("works across midnight", () => {
    const late = reminder({ date: "2026-11-12", time: "23:58" })
    expect(run("2026-11-13", "00:05", [late]).map(e => e.key)).toEqual(["reminder:r1:at"])
  })

  it("never sends a completed reminder", () => {
    expect(run("2026-11-12", "14:30", [reminder({ completed: true })])).toEqual([])
  })

  it("sends an untimed reminder at the morning time of its day", () => {
    const allDay = reminder({ time: null })
    expect(run("2026-11-12", "08:59", [allDay])).toEqual([])
    expect(run("2026-11-12", "09:00", [allDay]).map(e => e.key)).toEqual(["reminder:r1:day"])
    expect(run("2026-11-12", "09:00", [allDay], [], { notifyTime: "07:30" })).toEqual([])
    expect(run("2026-11-11", "09:00", [allDay])).toEqual([])
  })

  it("warns about a critical reminder 24 h and 1 h ahead", () => {
    const critical = reminder({ priority: "critical", date: "2026-11-13", time: "10:00" })
    expect(run("2026-11-12", "09:59", [critical])).toEqual([])
    expect(run("2026-11-12", "10:00", [critical]).map(e => e.key)).toEqual(["reminder:r1:24h"])
    expect(run("2026-11-13", "09:00", [critical], ["reminder:r1:24h"]).map(e => e.key)).toEqual([
      "reminder:r1:1h",
    ])
    expect(
      run("2026-11-13", "10:00", [critical], ["reminder:r1:24h", "reminder:r1:1h"]).map(e => e.key),
    ).toEqual(["reminder:r1:at"])
  })

  it("a normal reminder gets no advance warnings", () => {
    expect(run("2026-11-12", "13:45", [reminder()])).toEqual([])
  })
})

describe("duePushes — morning digest", () => {
  const digest = { tasksDueToday: 2, tasksOverdue: 1, habitsToday: 5, remindersToday: 0 }

  it("goes out once in the morning window when there is something to say", () => {
    expect(run("2026-11-12", "09:10", [], [], { digest }).map(e => e.key)).toEqual(["digest:2026-11-12"])
    expect(run("2026-11-12", "09:10", [], ["digest:2026-11-12"], { digest })).toEqual([])
    expect(run("2026-11-12", "09:40", [], [], { digest })).toEqual([])
  })

  it("is skipped when turned off or empty", () => {
    expect(run("2026-11-12", "09:00", [], [], { digest, notifyDigest: false })).toEqual([])
    const empty = { tasksDueToday: 0, tasksOverdue: 0, habitsToday: 0, remindersToday: 0 }
    expect(run("2026-11-12", "09:00", [], [], { digest: empty })).toEqual([])
  })

  it("reads naturally in Russian and English", () => {
    const [event] = run("2026-11-12", "09:00", [], [], { digest })
    expect(pushMessage(event, "ru").body).toBe("2 задачи со сроком сегодня · 1 просрочена · 5 привычек")
    expect(pushMessage(event, "en").body).toBe("2 tasks due today · 1 overdue · 5 habits")
  })
})

describe("pushMessage — reminders", () => {
  it("says when a critical reminder is due", () => {
    const critical = reminder({ priority: "critical", date: "2026-11-13", time: "10:00" })
    const [event] = run("2026-11-12", "10:00", [critical])
    expect(pushMessage(event, "ru")).toMatchObject({
      title: "Позвонить маме",
      body: "Важное · завтра в 10:00",
    })
    const [at] = run("2026-11-12", "14:30", [reminder()])
    expect(pushMessage(at, "en").body).toBe("Reminder · 14:30")
  })
})
