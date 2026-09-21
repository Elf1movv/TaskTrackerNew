import { createContext, useContext } from "react"
import type { Task } from "@/entities/task"
import type { MonthGridDay } from "@/widgets/calendar-grid"

export interface CalendarContextValue {
  calMonth: Date
  monthGrid: MonthGridDay[]
  selectedDay: Date | null
  selectedTasks: Task[]
  allTasks: Task[]
  selectDay: (day: Date | null) => void
  goToPrevMonth: () => void
  goToNextMonth: () => void
  goToToday: () => void
  goToMonth: (date: Date) => void
  moveTaskToDay: (taskId: string, day: Date) => void
}

export const CalendarContext = createContext<CalendarContextValue | null>(null)

export function useCalendarContext(): CalendarContextValue {
  const ctx = useContext(CalendarContext)
  if (!ctx) throw new Error("useCalendarContext must be used within a CalendarProvider")
  return ctx
}
