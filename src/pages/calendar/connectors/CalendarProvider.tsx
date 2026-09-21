import { useCallback, useMemo, useState, type ReactNode } from "react"
import { addMonths, subMonths } from "date-fns"
import { isTaskOnDay, useTasks } from "@/entities/task"
import { formatDateKey } from "@/shared/lib/date"
import { buildMonthGrid } from "@/widgets/calendar-grid"
import { CalendarContext } from "./calendarContext"

export function CalendarProvider({ children }: { children: ReactNode }) {
  const { tasks, updateTask } = useTasks()
  const [calMonth, setCalMonth] = useState(new Date())
  // No day selected by default — the day panel only appears once the user
  // actually taps a day (see docs/requirements), not pre-filled with today.
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  const monthGrid = useMemo(() => buildMonthGrid(calMonth), [calMonth])

  const selectedTasks = useMemo(() => {
    if (!selectedDay) return []
    const selectedKey = formatDateKey(selectedDay)
    return tasks.filter(t => isTaskOnDay(t, selectedKey))
  }, [tasks, selectedDay])

  const selectDay = useCallback((day: Date | null) => setSelectedDay(day), [])
  const goToPrevMonth = useCallback(() => setCalMonth(d => subMonths(d, 1)), [])
  const goToNextMonth = useCallback(() => setCalMonth(d => addMonths(d, 1)), [])
  const goToToday = useCallback(() => {
    const now = new Date()
    setCalMonth(now)
    setSelectedDay(now)
  }, [])
  const goToMonth = useCallback((date: Date) => setCalMonth(date), [])

  const moveTaskToDay = useCallback(
    (taskId: string, day: Date) => {
      const task = tasks.find(t => t.id === taskId)
      if (!task) return
      updateTask(taskId, { dueDate: formatDateKey(day) })
    },
    [tasks, updateTask],
  )

  const value = useMemo(
    () => ({
      calMonth,
      monthGrid,
      selectedDay,
      selectedTasks,
      allTasks: tasks,
      selectDay,
      goToPrevMonth,
      goToNextMonth,
      goToToday,
      goToMonth,
      moveTaskToDay,
    }),
    [
      calMonth,
      monthGrid,
      selectedDay,
      selectedTasks,
      tasks,
      selectDay,
      goToPrevMonth,
      goToNextMonth,
      goToToday,
      goToMonth,
      moveTaskToDay,
    ],
  )

  return <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>
}
