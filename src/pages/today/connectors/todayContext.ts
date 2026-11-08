import { createContext, useContext } from "react"
import type { Goal } from "@/entities/goal"
import type { Habit } from "@/entities/habit"
import type { Reminder } from "@/entities/reminder"

export interface TodayContextValue {
  goals: Goal[]
  habits: Habit[]
  reminders: Reminder[]
  remindersLoaded: boolean
}

export const TodayContext = createContext<TodayContextValue | null>(null)

export function useTodayContext(): TodayContextValue {
  const ctx = useContext(TodayContext)
  if (!ctx) throw new Error("useTodayContext must be used within a TodayProvider")
  return ctx
}
