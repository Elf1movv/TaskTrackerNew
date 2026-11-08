import { startOfMonth } from "date-fns"
import type { Habit } from "@/entities/habit"
import { formatDateKey } from "@/shared/lib/date"
import { getDayCellState } from "./habitCellState"
import { getPeriodDays, getYearMonths, type HabitHistoryPeriod } from "./periodColumns"

export interface ChartPoint {
  label: string
  value: number
}

export interface HabitHistorySummary {
  chartData: ChartPoint[]
  completed: number
  total: number
}

// One point per day (week/month) — how many habits were actually done
// that day, out of the whole period's scheduled/done totals used for the
// "Выполнено: X из Y" line below the chart.
function summarizeByDay(habits: Habit[], days: Date[], today: Date): HabitHistorySummary {
  let completed = 0
  let total = 0
  const chartData = days.map(date => {
    let doneToday = 0
    for (const habit of habits) {
      const state = getDayCellState(habit, date, today)
      if (state === "unscheduled" || state === "future") continue
      total++
      if (state === "done") {
        completed++
        doneToday++
      }
    }
    return { label: formatDateKey(date).slice(8), value: doneToday }
  })
  return { chartData, completed, total }
}

// One point per month (year view) — total habit-days completed that
// month, across all habits.
function summarizeByMonth(habits: Habit[], months: Date[], today: Date): HabitHistorySummary {
  let completed = 0
  let total = 0
  const chartData = months.map(month => {
    // Whole month still ahead of today (compares year too, not just the
    // month number — a later year's same month is also in the future).
    if (startOfMonth(month) > today) {
      return { label: String(month.getMonth() + 1), value: 0 }
    }
    const year = month.getFullYear()
    const monthIndex = month.getMonth()
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
    const lastDay =
      monthIndex === today.getMonth() && year === today.getFullYear() ? today.getDate() : daysInMonth

    let monthCompleted = 0
    for (const habit of habits) {
      for (let day = 1; day <= lastDay; day++) {
        const date = new Date(year, monthIndex, day)
        if (!habit.activeDays.includes(date.getDay())) continue
        total++
        if (habit.completedDates.includes(formatDateKey(date))) {
          completed++
          monthCompleted++
        }
      }
    }
    return { label: String(month.getMonth() + 1), value: monthCompleted }
  })
  return { chartData, completed, total }
}

// `anchor` picks which week/month/year is summarized; `today` stays the real
// current date so nothing after it is counted.
export function getHabitHistorySummary(
  habits: Habit[],
  period: HabitHistoryPeriod,
  anchor: Date,
  today: Date,
): HabitHistorySummary {
  if (period === "year") return summarizeByMonth(habits, getYearMonths(anchor), today)
  return summarizeByDay(habits, getPeriodDays(period, anchor), today)
}
