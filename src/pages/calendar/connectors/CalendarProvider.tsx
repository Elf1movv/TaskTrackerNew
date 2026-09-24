import { useCallback, useMemo, useState, type ReactNode } from "react"
import { addDays, addMonths, addWeeks, addYears, subDays, subMonths, subWeeks, subYears } from "date-fns"
import { isGoalDueOnDay, useGoals } from "@/entities/goal"
import { selectHabitsOnDay, useHabits } from "@/entities/habit"
import { selectRemindersOnDay, useReminders } from "@/entities/reminder"
import { isTaskOnDay, useTasks } from "@/entities/task"
import { formatDateKey } from "@/shared/lib/date"
import { addMinutesToTime, minutesFromMidnight } from "@/shared/lib/timeOffset"
import { CalendarContext, type CalendarView } from "./calendarContext"

export function CalendarProvider({ children }: { children: ReactNode }) {
  const { tasks, updateTask } = useTasks()
  const { reminders } = useReminders()
  const { goals, updateGoal } = useGoals()
  const { habits } = useHabits()

  const [view, setView] = useState<CalendarView>("month")
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

  const selectedTasks = useMemo(() => {
    if (!selectedDay) return []
    const selectedKey = formatDateKey(selectedDay)
    return tasks.filter(t => isTaskOnDay(t, selectedKey))
  }, [tasks, selectedDay])

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

  const moveTaskToDay = useCallback(
    (taskId: string, day: Date) => {
      const task = tasks.find(t => t.id === taskId)
      if (!task) return
      updateTask(taskId, { dueDate: formatDateKey(day) })
    },
    [tasks, updateTask],
  )

  const moveGoalDeadline = useCallback(
    (goalId: string, day: Date) => {
      const goal = goals.find(g => g.id === goalId)
      if (!goal) return
      updateGoal(goalId, { targetDate: formatDateKey(day) })
    },
    [goals, updateGoal],
  )

  // Day/Week's hour-timeline drag-to-reschedule — a plain PATCH, same
  // shape as moveTaskToDay, just also carrying the new time. Shifts
  // endTime by the same delta as time so the block's duration survives
  // the move instead of silently collapsing to whatever the old endTime
  // now means relative to the new start. Dropping onto the all-day row
  // (time === null) clears endTime too, same "clearing the anchor clears
  // what depends on it" rule TaskForm already applies to time itself.
  const rescheduleTaskTime = useCallback(
    (taskId: string, day: Date, time: string | null) => {
      const task = tasks.find(t => t.id === taskId)
      if (!task) return
      let endTime: string | null = null
      if (time && task.time && task.endTime) {
        const deltaMinutes = minutesFromMidnight(time) - minutesFromMidnight(task.time)
        endTime = addMinutesToTime(task.endTime, deltaMinutes)
      }
      updateTask(taskId, { dueDate: formatDateKey(day), time, endTime })
    },
    [tasks, updateTask],
  )

  // The hour-timeline's resize handle — start time is untouched, only how
  // far the block stretches changes.
  const resizeTask = useCallback(
    (taskId: string, endTime: string) => updateTask(taskId, { endTime }),
    [updateTask],
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
      allTasks: tasks,
      allReminders: reminders,
      allGoals: goals,
      allHabits: habits,
      selectedTasks,
      selectedReminders,
      selectedGoals,
      selectedHabits,
      moveTaskToDay,
      moveGoalDeadline,
      rescheduleTaskTime,
      resizeTask,
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
      tasks,
      reminders,
      goals,
      habits,
      selectedTasks,
      selectedReminders,
      selectedGoals,
      selectedHabits,
      moveTaskToDay,
      moveGoalDeadline,
      rescheduleTaskTime,
      resizeTask,
    ],
  )

  return <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>
}
