import { format, isSameDay, isSameMonth, startOfMonth } from "date-fns"
import { Check } from "lucide-react"
import { useNavigate } from "react-router"
import { getHabitMonthCompletionStats, getStreak, useHabits, type Habit } from "@/entities/habit"
import { formatDateKey } from "@/shared/lib/date"
import { getDateLocale, getWeekdayLabels, useLanguage } from "@/shared/lib/i18n"
import { getDayCellState, getDayCellStyle } from "../../lib/habitCellState"
import { getPeriodDays, getYearMonths } from "../../lib/periodColumns"

// The phone's Week / Month / Year rows of one block (mockups "с блоками",
// 2026-11-16): the habit's name on its own line, its days or months below it
// across the full width — nothing scrolls sideways any more.

function HabitName({ habit, meta }: { habit: Habit; meta: string }) {
  const navigate = useNavigate()
  const { t } = useLanguage()
  return (
    <button
      type="button"
      onClick={() => navigate(`/habits/${habit.id}`)}
      aria-label={t("habits.openHabit", { title: habit.title })}
      className="flex w-full items-center gap-2 text-left min-h-7"
    >
      <span className="size-2 shrink-0 rounded-full" style={{ background: habit.color }} />
      <span className="flex-1 min-w-0 text-body font-semibold leading-tight break-words">{habit.title}</span>
      <span className="shrink-0 text-meta font-semibold text-muted-foreground tabular-nums">{meta}</span>
    </button>
  )
}

const SEVEN = { gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }
const TWELVE = { gridTemplateColumns: "repeat(12, minmax(0, 1fr))" }

export function WeekRows({ habits, anchor, today }: { habits: Habit[]; anchor: Date; today: Date }) {
  const { toggleHabit } = useHabits()
  const { t, language } = useLanguage()
  const days = getPeriodDays("week", anchor)
  const labels = getWeekdayLabels(language)

  return (
    <div className="flex flex-col gap-2">
      <div className="grid gap-1.5" style={SEVEN}>
        {days.map((day, i) => (
          <span
            key={day.toISOString()}
            className={`text-center text-caption font-bold uppercase ${
              isSameDay(day, today) ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {labels[i]} {day.getDate()}
          </span>
        ))}
      </div>
      {habits.map(habit => (
        <div key={habit.id} className="flex flex-col gap-2 border-t border-border pt-2">
          <HabitName
            habit={habit}
            meta={t("habits.streakShort", { count: getStreak(habit.completedDates, habit.activeDays) })}
          />
          <div className="grid gap-1.5" style={SEVEN}>
            {days.map(day => {
              const state = getDayCellState(habit, day, today)
              const dateKey = formatDateKey(day)
              const clickable = state === "done" || state === "pending"
              return (
                <button
                  key={dateKey}
                  type="button"
                  disabled={!clickable}
                  aria-pressed={state === "done"}
                  aria-label={t("habits.markDay", { title: habit.title, date: dateKey })}
                  onClick={() => toggleHabit(habit.id, dateKey)}
                  className="mx-auto aspect-square w-full max-w-10 rounded-full border-2 flex items-center justify-center disabled:cursor-default"
                  style={{
                    ...getDayCellStyle(state, habit.color),
                    outline:
                      isSameDay(day, today) && state !== "done" ? "2px solid var(--primary)" : undefined,
                    outlineOffset: -2,
                  }}
                >
                  {state === "done" && <Check size={16} strokeWidth={2.5} aria-hidden />}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

export function MonthRows({ habits, anchor, today }: { habits: Habit[]; anchor: Date; today: Date }) {
  const { t } = useLanguage()
  const first = startOfMonth(anchor)
  const lead = (first.getDay() + 6) % 7
  const days = getPeriodDays("month", anchor)

  return (
    <div className="flex flex-col">
      {habits.map(habit => {
        const { done, scheduled } = getHabitMonthCompletionStats(habit, anchor, today)
        const streak = getStreak(habit.completedDates, habit.activeDays)
        const stat =
          t("habits.doneOf", { done, total: scheduled }) +
          (streak > 0 && isSameMonth(anchor, today) ? ` · ${t("habits.streakShort", { count: streak })}` : "")
        return (
          <div
            key={habit.id}
            className="flex items-center gap-3 border-t border-border py-2.5 first:border-t-0"
          >
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <HabitName habit={habit} meta="" />
              <span className="pl-4 text-meta text-muted-foreground tabular-nums">{stat}</span>
            </div>
            {/* Look-only: a cell here is ~15 px, too small for a finger. The
                habit screen has the same month at full size, tappable. */}
            <div className="grid w-[126px] shrink-0 gap-[3px]" style={SEVEN} aria-hidden>
              {Array.from({ length: lead }, (_, i) => (
                <span key={`lead-${i}`} />
              ))}
              {days.map(day => {
                const state = getDayCellState(habit, day, today)
                const beforeCreated = formatDateKey(day) < formatDateKey(new Date(habit.createdAt))
                const background =
                  state === "done"
                    ? habit.color
                    : state === "pending" && !beforeCreated
                      ? "var(--muted)"
                      : state === "future"
                        ? "color-mix(in srgb, var(--muted) 35%, transparent)"
                        : "color-mix(in srgb, var(--muted) 55%, transparent)"
                return (
                  <span
                    key={day.toISOString()}
                    className="aspect-square rounded-[3px]"
                    style={{
                      background,
                      outline: isSameDay(day, today) ? "1.5px solid var(--primary)" : undefined,
                      outlineOffset: -1.5,
                    }}
                  />
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function YearRows({
  habits,
  anchor,
  today,
  onPickMonth,
}: {
  habits: Habit[]
  anchor: Date
  today: Date
  onPickMonth: (month: Date) => void
}) {
  const { t, language } = useLanguage()
  const locale = getDateLocale(language)
  const months = getYearMonths(anchor)

  return (
    <div className="flex flex-col gap-2">
      <div className="grid gap-1" style={TWELVE} aria-hidden>
        {months.map(month => (
          <span
            key={month.toISOString()}
            className={`text-center text-caption font-bold uppercase ${
              isSameMonth(month, today) ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {format(month, "LLLLL", { locale })}
          </span>
        ))}
      </div>
      {habits.map(habit => {
        const stats = months.map(month => getHabitMonthCompletionStats(habit, month, today))
        const done = stats.reduce((sum, s) => sum + s.done, 0)
        const scheduled = stats.reduce((sum, s) => sum + s.scheduled, 0)
        const percent = scheduled === 0 ? 0 : Math.round((done / scheduled) * 100)
        const streak = getStreak(habit.completedDates, habit.activeDays)
        return (
          <div key={habit.id} className="flex flex-col gap-2 border-t border-border pt-2">
            <HabitName
              habit={habit}
              meta={`${percent}%${streak > 0 ? ` · ${t("habits.streakShort", { count: streak })}` : ""}`}
            />
            <div className="grid gap-1" style={TWELVE}>
              {months.map((month, i) => {
                const s = stats[i]
                const share = s.scheduled === 0 ? null : s.done / s.scheduled
                const monthName = format(month, "LLLL yyyy", { locale })
                return (
                  <button
                    key={month.toISOString()}
                    type="button"
                    disabled={share === null}
                    onClick={() => onPickMonth(month)}
                    aria-label={`${t("habits.yearMonthOpen", { month: monthName })}: ${t("habits.doneOf", {
                      done: s.done,
                      total: s.scheduled,
                    })}`}
                    className="aspect-square rounded-md disabled:cursor-default"
                    style={{
                      background:
                        share === null
                          ? "color-mix(in srgb, var(--muted) 45%, transparent)"
                          : share === 0
                            ? "var(--muted)"
                            : `color-mix(in srgb, ${habit.color} ${Math.round(25 + 75 * share)}%, var(--muted))`,
                      outline: isSameMonth(month, today) ? "2px solid var(--primary)" : undefined,
                      outlineOffset: -2,
                    }}
                  />
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// The block's chart on the phone: one bar per column above (7 days or 12
// months), so each bar sits right under its own day/month.
export function PeriodBars({ values, max, color }: { values: number[]; max: number; color: string }) {
  return (
    <div
      className="grid h-[34px] items-end gap-1"
      style={{ gridTemplateColumns: `repeat(${values.length}, minmax(0, 1fr))` }}
      aria-hidden
    >
      {values.map((value, i) => (
        <span
          key={i}
          className="mx-auto w-3/5 rounded-t-[4px] rounded-b-[1px]"
          style={{
            height: max === 0 ? 0 : `${Math.round((value / max) * 34)}px`,
            minHeight: value > 0 ? 2 : 0,
            background: color,
            opacity: 0.75,
          }}
        />
      ))}
    </div>
  )
}
