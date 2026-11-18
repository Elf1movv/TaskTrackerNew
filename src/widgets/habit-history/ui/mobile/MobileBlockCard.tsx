import { useMemo, useState, type ReactNode } from "react"
import { format } from "date-fns"
import { ChevronDown } from "lucide-react"
import { EditHabitGroupButton } from "@/features/edit-habit-group"
import { DeleteHabitGroupButton } from "@/features/delete-habit-group"
import { HabitGroupForm } from "@/features/habit-group-form"
import { HABIT_MOVE_TYPE, useHabitGroupDnd } from "@/features/habit/group-dnd"
import { getDayCounts, getYearMap, HabitIcon, useHabits, type Habit } from "@/entities/habit"
import { getHabitGroupIcon, getHabitGroupTitle, type HabitGroup } from "@/entities/habit-group"
import { useDropTarget } from "@/shared/lib/dnd"
import { capitalizeFirst, getDateLocale, useLanguage } from "@/shared/lib/i18n"
import { ProgressRing } from "@/shared/ui/progress-ring"
import { YearHeatmap } from "@/shared/ui/year-heatmap"
import { getHabitHistorySummary } from "../../lib/habitHistorySummary"
import type { HabitHistoryPeriod } from "../../lib/periodColumns"
import { DayHabitList } from "../DayHabitList"
import { MonthRows, PeriodBars, WeekRows, YearRows } from "./PeriodRows"

// One block on the phone. Owner notes 2026-11-18:
// - Day: no card frame — the block is a small caption above its rows, as in
//   the "День с блоками" mockup (frames ate the little room there is).
// - Week / Month / Year keep the card.
// - Collapsed = just the header line; only Year also shows the year heat map.
//   The header figure follows the period (Month: the month's %, Year: the
//   year's %).
// - Day and Week rows have a six-dot handle: drop on a row to reorder or move
//   the habit to that row's block; drop on a header to move it there.
export function MobileBlockCard({
  group,
  habits,
  period,
  anchor,
  today,
  collapsed,
  onToggleCollapsed,
  onPickMonth,
}: {
  group: HabitGroup
  habits: Habit[]
  period: HabitHistoryPeriod
  anchor: Date
  today: Date
  collapsed: boolean
  onToggleCollapsed: () => void
  onPickMonth: (month: Date) => void
}) {
  const { t, language } = useLanguage()
  const locale = getDateLocale(language)
  const { moveHabitToGroup } = useHabits()
  const { dropHabitOn } = useHabitGroupDnd(group)
  const { ref: headerDropRef, isOver } = useDropTarget<HTMLDivElement>({
    type: HABIT_MOVE_TYPE,
    onDrop: habitId => moveHabitToGroup(habitId, group.id),
  })
  const [isEditing, setIsEditing] = useState(false)
  const title = group.isGeneral ? t("habits.withoutBlock") : getHabitGroupTitle(group, t)
  const isDay = period === "day"

  // Keyed by today's date, not the `today` object (a new one every render).
  const todayKey = today.toDateString()
  const showYearMap = collapsed && period === "year" && habits.length > 0
  const yearMap = useMemo(() => {
    if (!showYearMap) return null
    const now = new Date(todayKey)
    return getYearMap(habits, now.getFullYear(), now)
  }, [showYearMap, habits, todayKey])
  const summary = getHabitHistorySummary(habits, period, anchor, today)
  const percent = summary.total === 0 ? 0 : Math.round((summary.completed / summary.total) * 100)

  let headerMeta: ReactNode = null
  if (period === "day") {
    headerMeta = t("habits.doneOf", { done: summary.completed, total: summary.total })
  } else if (period === "week") {
    const counts = getDayCounts(habits, today, today)
    if (counts) headerMeta = t("habits.doneToday", { done: counts.done, total: counts.scheduled })
  } else if (period === "month") {
    headerMeta = collapsed ? (
      `${percent}%`
    ) : (
      <span className="block size-10">
        <ProgressRing
          progress={percent}
          color={group.color}
          strokeWidth={4}
          labelClassName="text-[10px] font-bold"
          labelColor="var(--foreground)"
        />
      </span>
    )
  } else {
    headerMeta = t("habits.percentYear", { percent })
  }

  const summaryLabel =
    period === "week"
      ? t("habits.period.week")
      : period === "month"
        ? capitalizeFirst(format(anchor, "LLLL", { locale }))
        : format(anchor, "yyyy")

  const header = (
    <div
      ref={headerDropRef}
      className={`flex items-center gap-1 rounded-md transition-colors ${isOver ? "bg-accent" : ""}`}
    >
      <button
        type="button"
        onClick={onToggleCollapsed}
        aria-expanded={!collapsed}
        className={`flex flex-1 min-w-0 items-center text-left ${isDay ? "gap-2 min-h-9 px-1" : "gap-2.5 min-h-10"}`}
      >
        <span
          className={`shrink-0 flex items-center justify-center ${isDay ? "size-[22px] rounded-[7px]" : "size-8 rounded-md"}`}
          style={{ background: `color-mix(in srgb, ${group.color} 16%, transparent)`, color: group.color }}
        >
          <HabitIcon emoji={getHabitGroupIcon(group)} size={isDay ? 12 : 16} />
        </span>
        <span
          className={`flex-1 min-w-0 break-words leading-tight ${
            isDay
              ? "text-meta font-bold uppercase tracking-[0.04em] text-muted-foreground"
              : "text-title font-semibold"
          }`}
        >
          {title}
        </span>
        <span className="shrink-0 text-meta font-semibold text-muted-foreground tabular-nums">
          {headerMeta}
        </span>
        <ChevronDown
          size={isDay ? 16 : 18}
          aria-hidden
          className={`shrink-0 text-muted-foreground transition-transform ${collapsed ? "" : "rotate-180"}`}
        />
      </button>
      {!collapsed && !group.isGeneral && (
        <span className="flex items-center shrink-0" aria-label={t("habits.blockActions")}>
          <EditHabitGroupButton onClick={() => setIsEditing(v => !v)} />
          <DeleteHabitGroupButton group={group} />
        </span>
      )}
    </div>
  )

  const body = collapsed ? (
    yearMap && (
      <YearHeatmap
        grid={yearMap.grid}
        values={yearMap.values}
        color={group.color}
        todayIndex={yearMap.todayIndex}
        monthLabels={Array.from({ length: 12 }, (_, m) =>
          format(new Date(today.getFullYear(), m, 1), "LLL", { locale }).replace(".", ""),
        )}
        label={`${today.getFullYear()}: ${t("habits.percentYear", { percent })}`}
      />
    )
  ) : habits.length === 0 ? (
    <div className="py-4 text-center text-meta text-muted-foreground">
      {t(group.isGeneral ? "habits.withoutBlockEmpty" : "habits.noHabitsYet")}
    </div>
  ) : isDay ? (
    <DayHabitList habits={habits} date={anchor} today={today} onDropHabit={dropHabitOn} />
  ) : (
    <>
      {period === "week" && (
        <WeekRows habits={habits} anchor={anchor} today={today} onDropHabit={dropHabitOn} />
      )}
      {period === "month" && <MonthRows habits={habits} anchor={anchor} today={today} />}
      {period === "year" && (
        <YearRows habits={habits} anchor={anchor} today={today} onPickMonth={onPickMonth} />
      )}
      <div className="flex flex-col gap-1.5 border-t border-border pt-2">
        {period !== "month" && (
          <PeriodBars
            values={summary.chartData.map(p => p.value)}
            // Week: out of all the block's habits; year: out of the best month.
            max={period === "week" ? habits.length : Math.max(1, ...summary.chartData.map(p => p.value))}
            color={group.color}
          />
        )}
        <span className="text-meta text-muted-foreground">
          {t("habits.periodSummary", {
            label: summaryLabel,
            done: summary.completed,
            total: summary.total,
            percent,
          })}
        </span>
      </div>
    </>
  )

  if (isDay) {
    return (
      <section className="flex flex-col gap-2">
        {header}
        {isEditing && !collapsed && <HabitGroupForm group={group} onDone={() => setIsEditing(false)} />}
        {body}
      </section>
    )
  }

  return (
    <section className="rounded-xl border border-card-border bg-card px-3.5 py-3.5 shadow-card flex flex-col gap-2.5">
      {header}
      {isEditing && !collapsed && <HabitGroupForm group={group} onDone={() => setIsEditing(false)} />}
      {body}
    </section>
  )
}
