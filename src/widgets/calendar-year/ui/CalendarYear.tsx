import { useMemo } from "react"
import { format, isToday } from "date-fns"
import { isGoalDueOnDay, type Goal } from "@/entities/goal"
import { selectHabitsOnDay, type Habit } from "@/entities/habit"
import { selectRemindersOnDay, type Reminder } from "@/entities/reminder"
import { isTaskOnDay, type Task } from "@/entities/task"
import { buildMonthGrid } from "@/shared/lib/calendarGrid"
import { formatDateKey } from "@/shared/lib/date"
import { getDateLocale, getWeekdayLabels, useLanguage } from "@/shared/lib/i18n"
import { monoFont } from "@/shared/lib/typography"

// The safest, lowest-risk of the five views: no drag, no hour timeline,
// just buildMonthGrid (already shared/lib, already used by Month) reused
// 12 times. Self-contained enough to be a real widget rather than a
// page-level composition — it doesn't depend on any sibling widget, only
// on shared/lib and entity selectors, same as CalendarGrid itself.
export function CalendarYear({
  year,
  tasks,
  reminders,
  goals,
  habits,
  onSelectDay,
}: {
  year: Date
  tasks: Task[]
  reminders: Reminder[]
  goals: Goal[]
  habits: Habit[]
  onSelectDay: (day: Date) => void
}) {
  const months = useMemo(
    () => Array.from({ length: 12 }, (_, i) => new Date(year.getFullYear(), i, 1)),
    [year],
  )

  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {months.map(month => (
        <YearMonthCard
          key={month.toISOString()}
          month={month}
          tasks={tasks}
          reminders={reminders}
          goals={goals}
          habits={habits}
          onSelectDay={onSelectDay}
        />
      ))}
    </div>
  )
}

function YearMonthCard({
  month,
  tasks,
  reminders,
  goals,
  habits,
  onSelectDay,
}: {
  month: Date
  tasks: Task[]
  reminders: Reminder[]
  goals: Goal[]
  habits: Habit[]
  onSelectDay: (day: Date) => void
}) {
  const { language } = useLanguage()
  const locale = getDateLocale(language)
  const days = useMemo(() => buildMonthGrid(month), [month])

  return (
    <div className="bg-card border border-border rounded-2xl p-3">
      <div css={monoFont} className="text-xs uppercase tracking-wider text-center mb-2 capitalize">
        {format(month, "LLLL", { locale })}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {getWeekdayLabels(language).map(label => (
          <div key={label} className="text-center text-[8px] text-muted-foreground/70">
            {label[0]}
          </div>
        ))}
        {days.map(({ date, isCurrentMonth }) => {
          const dayKey = formatDateKey(date)
          const hasContent =
            tasks.some(t => isTaskOnDay(t, dayKey)) ||
            selectRemindersOnDay(reminders, dayKey).length > 0 ||
            goals.some(g => isGoalDueOnDay(g, dayKey)) ||
            selectHabitsOnDay(habits, date).length > 0

          return (
            <button
              key={dayKey}
              onClick={() => onSelectDay(date)}
              className={`aspect-square rounded-md text-[10px] flex flex-col items-center justify-center gap-px ${
                isToday(date)
                  ? "bg-primary text-primary-foreground"
                  : isCurrentMonth
                    ? "hover:bg-accent text-foreground"
                    : "text-muted-foreground/40 hover:bg-accent/50"
              }`}
            >
              <span>{format(date, "d")}</span>
              {hasContent && (
                <span
                  className={`size-1 rounded-full ${
                    isToday(date) ? "bg-primary-foreground" : "bg-primary"
                  } ${!isCurrentMonth ? "opacity-50" : ""}`}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
