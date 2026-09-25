import { useMemo } from "react"
import { format, isToday } from "date-fns"
import { getGoalMonthCompletionStats, type Goal } from "@/entities/goal"
import { getHabitMonthCompletionStats, type Habit } from "@/entities/habit"
import { getTaskMonthCompletionStats, type Task } from "@/entities/task"
import { buildMonthGrid } from "@/shared/lib/calendarGrid"
import { getDateLocale, getWeekdayLabels, useLanguage } from "@/shared/lib/i18n"
import { monoFont } from "@/shared/lib/typography"
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover"
import { ProgressRing } from "@/shared/ui/progress-ring"

// The safest, lowest-risk of the five views: no drag, no hour timeline,
// just buildMonthGrid (already shared/lib, already used by Month) reused
// 12 times. Self-contained enough to be a real widget rather than a
// page-level composition — it doesn't depend on any sibling widget, only
// on shared/lib and entity selectors, same as CalendarGrid itself.
//
// Each month card used to show a per-DAY dot ("something exists on this
// day") — replaced with one per-MONTH completion ring (tasks + habits +
// goals combined), since the dot didn't say what was done vs. just
// scheduled. The day mini-grid itself stays (still useful to jump straight
// to a specific day), just without that dot.
export function CalendarYear({
  year,
  tasks,
  goals,
  habits,
  onSelectDay,
}: {
  year: Date
  tasks: Task[]
  goals: Goal[]
  habits: Habit[]
  onSelectDay: (day: Date) => void
}) {
  const today = useMemo(() => new Date(), [])
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
          today={today}
          tasks={tasks}
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
  today,
  tasks,
  goals,
  habits,
  onSelectDay,
}: {
  month: Date
  today: Date
  tasks: Task[]
  goals: Goal[]
  habits: Habit[]
  onSelectDay: (day: Date) => void
}) {
  const { t, language } = useLanguage()
  const locale = getDateLocale(language)
  const days = useMemo(() => buildMonthGrid(month), [month])
  const monthLabel = format(month, "LLLL yyyy", { locale })

  const { done, total } = useMemo(() => {
    const taskStats = getTaskMonthCompletionStats(tasks, month)
    const goalStats = getGoalMonthCompletionStats(goals, month)
    const habitStats = habits.reduce(
      (acc, habit) => {
        const stats = getHabitMonthCompletionStats(habit, month, today)
        return { done: acc.done + stats.done, scheduled: acc.scheduled + stats.scheduled }
      },
      { done: 0, scheduled: 0 },
    )
    return {
      done: taskStats.done + goalStats.done + habitStats.done,
      total: taskStats.total + goalStats.total + habitStats.scheduled,
    }
  }, [tasks, goals, habits, month, today])

  const percent = total === 0 ? 0 : Math.round((done / total) * 100)

  return (
    <div className="bg-card border border-border rounded-2xl p-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div css={monoFont} className="text-xs uppercase tracking-wider capitalize">
          {format(month, "LLLL", { locale })}
        </div>
        {total > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label={monthLabel}
                className="size-9 shrink-0 rounded-full transition-transform hover:scale-105"
              >
                <ProgressRing progress={percent} color="var(--primary)" strokeWidth={4} />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto px-3 py-2" side="top">
              <div className="text-xs font-medium capitalize mb-0.5">{monthLabel}</div>
              <div css={monoFont} className="text-sm">
                {t("calendar.yearMonthSummary", { done, total })}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {getWeekdayLabels(language).map(label => (
          <div key={label} className="text-center text-[8px] text-muted-foreground/70">
            {label[0]}
          </div>
        ))}
        {days.map(({ date, isCurrentMonth }) => (
          <button
            key={date.toISOString()}
            onClick={() => onSelectDay(date)}
            className={`aspect-square rounded-md text-[10px] flex items-center justify-center ${
              isToday(date)
                ? "bg-primary text-primary-foreground"
                : isCurrentMonth
                  ? "hover:bg-accent text-foreground"
                  : "text-muted-foreground/40 hover:bg-accent/50"
            }`}
          >
            {format(date, "d")}
          </button>
        ))}
      </div>
    </div>
  )
}
