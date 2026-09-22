import { Fragment, useState } from "react"
import { format } from "date-fns"
import { Activity, BarChart3, Flame, PieChart, Plus, TrendingUp } from "lucide-react"
import { HabitForm } from "@/features/habit-form"
import { EditHabitButton } from "@/features/edit-habit"
import { DeleteHabitButton } from "@/features/delete-habit"
import { getStreak, useHabits, type Habit } from "@/entities/habit"
import { formatDateKey } from "@/shared/lib/date"
import { getDateLocale, getWeekdayLabels, useLanguage } from "@/shared/lib/i18n"
import { monoFont } from "@/shared/lib/typography"
import { Button } from "@/shared/ui/button"
import { getDayCellState } from "../lib/habitCellState"
import { getHabitHistorySummary } from "../lib/habitHistorySummary"
import { getPeriodDays, getYearMonths, type HabitHistoryPeriod } from "../lib/periodColumns"
import { HabitHistoryChart, type HabitChartStyle } from "./HabitHistoryChart"
import { MonthCell } from "./MonthCell"

const PERIODS: HabitHistoryPeriod[] = ["week", "month", "year"]

const CHART_STYLES: { style: HabitChartStyle; Icon: typeof TrendingUp }[] = [
  { style: "area", Icon: TrendingUp },
  { style: "bar", Icon: BarChart3 },
  { style: "step", Icon: Activity },
  { style: "ring", Icon: PieChart },
]

export function HabitHistoryGrid({ habits }: { habits: Habit[] }) {
  const { toggleHabit } = useHabits()
  const { t, language } = useLanguage()
  const [period, setPeriod] = useState<HabitHistoryPeriod>("week")
  const [chartStyle, setChartStyle] = useState<HabitChartStyle>("area")
  const [isAdding, setIsAdding] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const today = new Date()
  const locale = getDateLocale(language)

  const days = period !== "year" ? getPeriodDays(period, today) : null
  const months = period === "year" ? getYearMonths(today) : null
  const columnCount = (days ?? months ?? []).length
  // Shared by the day/month grid below AND the chart section further
  // down, so the chart's plotted area lines up pixel-for-pixel with the
  // day columns instead of starting under the name column like before.
  const gridTemplateColumns = `minmax(120px, 220px) repeat(${columnCount}, minmax(0, 1fr))`
  const summary = getHabitHistorySummary(habits, period, today)
  const percent = summary.total === 0 ? 0 : Math.round((summary.completed / summary.total) * 100)
  const weekdayLabels = getWeekdayLabels(language)

  return (
    <div
      className="bg-card border border-border rounded-2xl p-6 space-y-6 mx-auto transition-[max-width] duration-300 ease-out"
      style={{ maxWidth: period === "month" ? "100%" : "56rem" }}
    >
      <div className="flex items-center justify-end flex-wrap gap-3">
        <div className="flex gap-0.5 bg-muted rounded-lg p-0.5">
          {PERIODS.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-2.5 py-1 rounded-md text-xs transition-all ${
                period === p
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t(`habits.period.${p}`)}
            </button>
          ))}
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditingHabit(null)
            setIsAdding(v => !v)
          }}
        >
          <Plus size={14} />
          {t("habits.addHabit")}
        </Button>
      </div>

      {(isAdding || editingHabit) && (
        <HabitForm
          habit={editingHabit ?? undefined}
          onDone={() => {
            setIsAdding(false)
            setEditingHabit(null)
          }}
        />
      )}

      {habits.length === 0 ? (
        !isAdding && (
          <div className="text-center py-12 text-muted-foreground text-sm">{t("habits.noHabitsYet")}</div>
        )
      ) : (
        // Fluid columns (1fr each), not a fixed pixel width — the whole
        // period always fits the container's width with no horizontal
        // scroll, at the cost of narrower cells for month view's ~30
        // columns than for week/year's 7-12.
        <div className="grid gap-y-2 gap-x-1" style={{ gridTemplateColumns }}>
          <div />
          {days?.map((date, i) => (
            <div key={date.toISOString()} className="text-center self-end pb-1">
              {period === "month" && (
                <div css={monoFont} className="text-[9px] text-muted-foreground/70 leading-tight">
                  {weekdayLabels[(date.getDay() + 6) % 7]}
                </div>
              )}
              <div css={monoFont} className="text-[10px] text-muted-foreground leading-tight">
                {period === "week" ? weekdayLabels[i] : date.getDate()}
              </div>
              {period === "week" && (
                <div css={monoFont} className="text-[9px] text-muted-foreground/70 leading-tight">
                  {date.getDate()}
                </div>
              )}
            </div>
          ))}
          {months?.map(month => (
            <div
              key={month.toISOString()}
              css={monoFont}
              className="text-[10px] text-muted-foreground text-center self-end pb-1 capitalize"
            >
              {format(month, "LLL", { locale })}
            </div>
          ))}

          {habits.map(habit => (
            <Fragment key={habit.id}>
              <div className="flex items-center gap-2 pr-2 group/row">
                <span className="text-base leading-none">{habit.icon}</span>
                <span className="text-sm font-medium truncate flex-1">{habit.title}</span>
                <span
                  css={monoFont}
                  className="flex items-center gap-0.5 text-[10px] text-muted-foreground shrink-0"
                >
                  <Flame size={10} />
                  {getStreak(habit.completedDates, habit.activeDays)}
                </span>
                <span className="hidden group-hover/row:flex items-center shrink-0">
                  <EditHabitButton onClick={() => setEditingHabit(habit)} />
                  <DeleteHabitButton habitId={habit.id} />
                </span>
              </div>
              {days?.map(date => {
                const state = getDayCellState(habit, date, today)
                const dateKey = formatDateKey(date)
                const clickable = state === "done" || state === "pending"
                return (
                  <button
                    key={`${habit.id}-${dateKey}`}
                    type="button"
                    disabled={!clickable}
                    onClick={() => clickable && toggleHabit(habit.id, dateKey)}
                    aria-label={`${habit.title} ${dateKey}`}
                    className="w-full max-w-10 aspect-square mx-auto rounded-full border transition-all disabled:cursor-default"
                    style={{
                      backgroundColor:
                        state === "done"
                          ? habit.color
                          : state === "unscheduled" || state === "future"
                            ? "var(--muted)"
                            : "transparent",
                      borderColor: state === "done" ? habit.color : "var(--border)",
                      borderStyle: state === "unscheduled" || state === "future" ? "dashed" : "solid",
                      opacity: state === "unscheduled" || state === "future" ? 0.6 : 1,
                    }}
                  />
                )
              })}
              {months?.map(month => (
                <div key={month.toISOString()} className="w-full max-w-10 aspect-square mx-auto">
                  <MonthCell habit={habit} month={month} today={today} />
                </div>
              ))}
            </Fragment>
          ))}
        </div>
      )}

      {habits.length > 0 && (
        <div className="pt-2 border-t border-border">
          {/* Same gridTemplateColumns as the day/month grid above — the
              chart's plotted area (columns 2..N) now starts at the exact
              same x-position as the first day column, instead of under
              the name column like before. Column 1, freed up by that
              alignment, holds the style switcher instead of sitting
              empty. */}
          <div className="grid gap-x-1 items-center" style={{ gridTemplateColumns }}>
            <div className="flex items-center gap-1">
              {CHART_STYLES.map(({ style, Icon }) => (
                <button
                  key={style}
                  onClick={() => setChartStyle(style)}
                  aria-label={t(`habits.chartStyle.${style}`)}
                  className={`flex items-center justify-center size-6 rounded-md transition-all ${
                    chartStyle === style
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon size={13} />
                </button>
              ))}
            </div>
            <div style={{ gridColumn: `2 / -1` }}>
              <HabitHistoryChart data={summary.chartData} style={chartStyle} percent={percent} />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            {t("habits.page.summary", { completed: summary.completed, total: summary.total, percent })}
          </p>
        </div>
      )}
    </div>
  )
}
