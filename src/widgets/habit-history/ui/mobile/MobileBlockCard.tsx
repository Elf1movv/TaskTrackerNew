import { useMemo, useState, type ReactNode } from "react"
import { format } from "date-fns"
import { ChevronDown } from "lucide-react"
import { EditHabitGroupButton } from "@/features/edit-habit-group"
import { DeleteHabitGroupButton } from "@/features/delete-habit-group"
import { HabitGroupForm } from "@/features/habit-group-form"
import { getDayCounts, getYearMap, HabitIcon, type Habit } from "@/entities/habit"
import { getHabitGroupIcon, getHabitGroupTitle, type HabitGroup } from "@/entities/habit-group"
import { capitalizeFirst, getDateLocale, useLanguage } from "@/shared/lib/i18n"
import { ProgressRing } from "@/shared/ui/progress-ring"
import { YearHeatmap } from "@/shared/ui/year-heatmap"
import { getHabitHistorySummary } from "../../lib/habitHistorySummary"
import type { HabitHistoryPeriod } from "../../lib/periodColumns"
import { DayHabitList } from "../DayHabitList"
import { MonthRows, PeriodBars, WeekRows, YearRows } from "./PeriodRows"

// One block on the phone (2026-11-16 mockups): a header that collapses it and,
// open, the shared period's rows plus the block's bars and summary line.
// Collapsed, it still shows something useful — the block's year as a heat map,
// in every period (owner decision 2026-11-16).
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
  const [isEditing, setIsEditing] = useState(false)
  const title = group.isGeneral ? t("habits.withoutBlock") : getHabitGroupTitle(group, t)

  // Keyed by today's date, not the `today` object (a new one every render).
  const todayKey = today.toDateString()
  const yearMap = useMemo(() => {
    if (!collapsed || habits.length === 0) return null
    const now = new Date(todayKey)
    return getYearMap(habits, now.getFullYear(), now)
  }, [collapsed, habits, todayKey])
  const summary = getHabitHistorySummary(habits, period, anchor, today)
  const percent = summary.total === 0 ? 0 : Math.round((summary.completed / summary.total) * 100)

  let headerMeta: ReactNode = null
  if (collapsed) {
    if (yearMap && yearMap.scheduled > 0)
      headerMeta = t("habits.percentYear", { percent: Math.round((yearMap.done / yearMap.scheduled) * 100) })
  } else if (period === "day") {
    headerMeta = t("habits.doneOf", { done: summary.completed, total: summary.total })
  } else if (period === "week") {
    const counts = getDayCounts(habits, today, today)
    if (counts) headerMeta = t("habits.doneToday", { done: counts.done, total: counts.scheduled })
  } else if (period === "month") {
    headerMeta = (
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

  return (
    <section className="rounded-xl border border-card-border bg-card px-3.5 py-3.5 shadow-card flex flex-col gap-2.5">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-expanded={!collapsed}
          className="flex flex-1 min-w-0 items-center gap-2.5 text-left min-h-10"
        >
          <span
            className="size-8 shrink-0 rounded-md flex items-center justify-center"
            style={{ background: `color-mix(in srgb, ${group.color} 16%, transparent)`, color: group.color }}
          >
            <HabitIcon emoji={getHabitGroupIcon(group)} size={16} />
          </span>
          <span className="flex-1 min-w-0 text-title font-semibold leading-tight break-words">{title}</span>
          <span className="shrink-0 text-meta font-semibold text-muted-foreground tabular-nums">
            {headerMeta}
          </span>
          <ChevronDown
            size={18}
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

      {isEditing && !collapsed && <HabitGroupForm group={group} onDone={() => setIsEditing(false)} />}

      {collapsed ? (
        yearMap && (
          <YearHeatmap
            grid={yearMap.grid}
            values={yearMap.values}
            color={group.color}
            todayIndex={yearMap.todayIndex}
            monthLabels={Array.from({ length: 12 }, (_, m) =>
              format(new Date(today.getFullYear(), m, 1), "LLL", { locale }).replace(".", ""),
            )}
            label={`${today.getFullYear()}: ${headerMeta ?? ""}`}
          />
        )
      ) : habits.length === 0 ? (
        <div className="py-4 text-center text-meta text-muted-foreground">
          {t(group.isGeneral ? "habits.withoutBlockEmpty" : "habits.noHabitsYet")}
        </div>
      ) : period === "day" ? (
        <DayHabitList habits={habits} date={anchor} today={today} />
      ) : (
        <>
          {period === "week" && <WeekRows habits={habits} anchor={anchor} today={today} />}
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
      )}
    </section>
  )
}
