import { useCallback, useMemo, useState, type ReactNode } from "react"
import { addDays, addMonths, addWeeks, addYears, subDays, subMonths, subWeeks, subYears } from "date-fns"
import { isGoalDueOnDay, useGoals } from "@/entities/goal"
import { selectHabitsOnDay, useHabits } from "@/entities/habit"
import { selectRemindersOnDay, useReminders } from "@/entities/reminder"
import { isTaskOnDay, useTasks } from "@/entities/task"
import { isPlanOnDay, usePlans } from "@/entities/calendar-plan"
import { formatDateKey } from "@/shared/lib/date"
import { minutesFromMidnight } from "@/shared/lib/timeOffset"
import { CalendarContext, type CalendarView } from "./calendarContext"

export function CalendarProvider({ children }: { children: ReactNode }) {
  const { plans, updatePlan } = usePlans()
  const { tasks: realTasks } = useTasks()
  const deadlines = useMemo(() => realTasks.filter(task => task.dueDate), [realTasks])
  const { reminders } = useReminders()
  const { goals } = useGoals()
  const { habits } = useHabits()

  const [view, setView] = useState<CalendarView>("day")
  const [anchorDate, setAnchorDate] = useState(new Date())
  // No day selected by default — the day panel only appears once the user
  // actually taps a day (see docs/requirements), not pre-filled with today.
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  const selectDay = useCallback((day: Date | null) => setSelectedDay(day), [])
  const goToDate = useCallback((date: Date) => setAnchorDate(date), [])

  // Shifts anchorDate by whichever unit the active view navigates in —
  // Agenda's "unit" is its whole fixed window (see buildAgendaRange),
  // not a calendar unit like the other four.
  const goToPrev = useCallback(() => {
    setAnchorDate(d => {
      switch (view) {
        case "day":
          return subDays(d, 1)
        case "week":
          return subWeeks(d, 1)
        case "month":
          return subMonths(d, 1)
        case "year":
          return subYears(d, 1)
        case "agenda":
          return subDays(d, 30)
      }
    })
  }, [view])

  const goToNext = useCallback(() => {
    setAnchorDate(d => {
      switch (view) {
        case "day":
          return addDays(d, 1)
        case "week":
          return addWeeks(d, 1)
        case "month":
          return addMonths(d, 1)
        case "year":
          return addYears(d, 1)
        case "agenda":
          return addDays(d, 30)
      }
    })
  }, [view])

  const goToToday = useCallback(() => {
    const now = new Date()
    setAnchorDate(now)
    setSelectedDay(now)
  }, [])

  const selectedPlans = useMemo(() => {
    if (!selectedDay) return []
    const selectedKey = formatDateKey(selectedDay)
    return plans.filter(t => isPlanOnDay(t, selectedKey))
  }, [plans, selectedDay])

  const selectedDeadlines = useMemo(() => {
    if (!selectedDay) return []
    const selectedKey = formatDateKey(selectedDay)
    return deadlines.filter(t => isTaskOnDay(t, selectedKey))
  }, [deadlines, selectedDay])

  const selectedReminders = useMemo(() => {
    if (!selectedDay) return []
    return selectRemindersOnDay(reminders, formatDateKey(selectedDay))
  }, [reminders, selectedDay])

  const selectedGoals = useMemo(() => {
    if (!selectedDay) return []
    const selectedKey = formatDateKey(selectedDay)
    return goals.filter(g => isGoalDueOnDay(g, selectedKey))
  }, [goals, selectedDay])

  const selectedHabits = useMemo(() => {
    if (!selectedDay) return []
    return selectHabitsOnDay(habits, selectedDay)
  }, [habits, selectedDay])

  const movePlanToDay = useCallback(
    (taskId: string, day: Date) => {
      const task = plans.find(t => t.id === taskId)
      if (!task) return
      updatePlan(taskId, { date: formatDateKey(day), onHold: false })
    },
    [plans, updatePlan],
  )

  // Day/Week's hour-timeline drag-to-reschedule — a plain PATCH, same
  // shape as movePlanToDay, just also carrying the new time. Shifts
  // endTime by the same delta as time so the block's duration survives
  // the move instead of silently collapsing to whatever the old endTime
  // now means relative to the new start. Dropping onto the all-day row
  // (time === null) clears endTime too, same "clearing the anchor clears
  // what depends on it" rule TaskForm already applies to time itself.
  const reschedulePlanTime = useCallback(
    (taskId: string, day: Date, time: string | null) => {
      const task = plans.find(t => t.id === taskId)
      if (!task) return
      const duration =
        task.time && task.endTime
          ? minutesFromMidnight(task.endTime) - minutesFromMidnight(task.time)
          : task.durationMinutes
      const startMinutes = time ? Math.min(minutesFromMidnight(time), 1439 - duration) : null
      // The drop is already snapped. Do not round an existing interval's
      // duration again (legacy or manually entered intervals may be 20 min).
      const clock = (minutes: number) =>
        `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`
      const start = startMinutes === null ? null : clock(Math.max(0, startMinutes))
      const endTime = startMinutes === null ? null : clock(Math.max(0, startMinutes) + duration)
      updatePlan(taskId, {
        date: formatDateKey(day),
        time: start,
        endTime,
        onHold: false,
        durationMinutes: duration,
      })
    },
    [plans, updatePlan],
  )

  // The hour-timeline's resize handle — start time is untouched, only how
  // far the block stretches changes.
  const resizePlan = useCallback(
    (taskId: string, endTime: string) => {
      const task = plans.find(t => t.id === taskId)
      if (task?.time && endTime > task.time)
        updatePlan(taskId, {
          endTime,
          durationMinutes: minutesFromMidnight(endTime) - minutesFromMidnight(task.time),
        })
    },
    [plans, updatePlan],
  )

  const value = useMemo(
    () => ({
      view,
      setView,
      anchorDate,
      goToPrev,
      goToNext,
      goToToday,
      goToDate,
      selectedDay,
      selectDay,
      allPlans: plans,
      allDeadlines: deadlines,
      selectedDeadlines,
      allReminders: reminders,
      allGoals: goals,
      allHabits: habits,
      selectedPlans,
      selectedReminders,
      selectedGoals,
      selectedHabits,
      movePlanToDay,
      reschedulePlanTime,
      resizePlan,
    }),
    [
      view,
      anchorDate,
      goToPrev,
      goToNext,
      goToToday,
      goToDate,
      selectedDay,
      selectDay,
      plans,
      deadlines,
      selectedDeadlines,
      reminders,
      goals,
      habits,
      selectedPlans,
      selectedReminders,
      selectedGoals,
      selectedHabits,
      movePlanToDay,
      reschedulePlanTime,
      resizePlan,
    ],
  )

  return <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>
}
