import { createContext, useContext } from "react"
import type { Goal } from "@/entities/goal"
import type { Habit } from "@/entities/habit"
import type { Reminder } from "@/entities/reminder"
import type { Task } from "@/entities/task"

export type CalendarView = "agenda" | "day" | "week" | "month" | "year"

export interface CalendarContextValue {
  view: CalendarView
  setView: (view: CalendarView) => void

  // Single source of truth for "where are we" — each view builds its own
  // grid/range from this (via shared/lib/calendarGrid.ts) instead of the
  // provider holding one Date-state variable per view, which could drift
  // out of sync with each other as views change independently.
  anchorDate: Date
  goToPrev: () => void
  goToNext: () => void
  goToToday: () => void
  goToDate: (date: Date) => void

  // Only meaningful for the "month" view (the day-detail side panel) —
  // Week/Day have their own hour timeline as the detail view, Agenda's
  // rows already show everything inline, neither needs a separate panel.
  selectedDay: Date | null
  selectDay: (day: Date | null) => void

  allTasks: Task[]
  allReminders: Reminder[]
  allGoals: Goal[]
  allHabits: Habit[]
  selectedTasks: Task[]
  selectedReminders: Reminder[]
  selectedGoals: Goal[]
  // Habits scheduled on selectedDay's weekday — read-only on the calendar
  // (see DayHabitRow), so unlike the other three there's no corresponding
  // moveHabitTo* action.
  selectedHabits: Habit[]

  moveTaskToDay: (taskId: string, day: Date) => void
  moveGoalDeadline: (goalId: string, day: Date) => void
  rescheduleTaskTime: (taskId: string, day: Date, time: string | null) => void
  // Day's hour-timeline resize handle — adjusts only endTime, start stays put.
  resizeTask: (taskId: string, endTime: string) => void
}

export const CalendarContext = createContext<CalendarContextValue | null>(null)

export function useCalendarContext(): CalendarContextValue {
  const ctx = useContext(CalendarContext)
  if (!ctx) throw new Error("useCalendarContext must be used within a CalendarProvider")
  return ctx
}
