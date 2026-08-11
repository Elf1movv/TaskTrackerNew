import { createContext, useContext } from "react"
import type { Task } from "@/entities/task"
import type { MonthGrid } from "../utilits/buildMonthGrid"

export interface CalendarContextValue {
  calMonth: Date
  monthGrid: MonthGrid
  selectedDay: Date
  selectedTasks: Task[]
  allTasks: Task[]
  selectDay: (day: Date) => void
  goToPrevMonth: () => void
  goToNextMonth: () => void
  goToToday: () => void
}

export const CalendarContext = createContext<CalendarContextValue | null>(null)

export function useCalendarContext(): CalendarContextValue {
  const ctx = useContext(CalendarContext)
  if (!ctx) throw new Error("useCalendarContext must be used within a CalendarProvider")
  return ctx
}
