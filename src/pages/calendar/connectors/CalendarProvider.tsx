import { useCallback, useMemo, useState, type ReactNode } from "react"
import { addMonths, subMonths } from "date-fns"
import { useTasks } from "@/entities/task"
import { formatDateKey } from "@/shared/lib/date"
import { buildMonthGrid } from "../lib/buildMonthGrid"
import { CalendarContext } from "./calendarContext"

export function CalendarProvider({ children }: { children: ReactNode }) {
  const { tasks } = useTasks()
  const [calMonth, setCalMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(new Date())

  const monthGrid = useMemo(() => buildMonthGrid(calMonth), [calMonth])

  const selectedTasks = useMemo(() => {
    const selectedKey = formatDateKey(selectedDay)
    return tasks.filter(t => t.dueDate === selectedKey)
  }, [tasks, selectedDay])

  const selectDay = useCallback((day: Date) => setSelectedDay(day), [])
  const goToPrevMonth = useCallback(() => setCalMonth(d => subMonths(d, 1)), [])
  const goToNextMonth = useCallback(() => setCalMonth(d => addMonths(d, 1)), [])
  const goToToday = useCallback(() => {
    const now = new Date()
    setCalMonth(now)
    setSelectedDay(now)
  }, [])

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
    ],
  )

  return <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>
}
