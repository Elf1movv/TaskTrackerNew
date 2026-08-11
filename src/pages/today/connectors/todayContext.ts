import { createContext, useContext } from "react"
import type { Task } from "@/entities/task"
import type { Goal } from "@/entities/goal"
import type { Habit } from "@/entities/habit"

export interface TodayContextValue {
  todayTasks: Task[]
  goals: Goal[]
  habits: Habit[]
}

export const TodayContext = createContext<TodayContextValue | null>(null)

export function useTodayContext(): TodayContextValue {
  const ctx = useContext(TodayContext)
  if (!ctx) throw new Error("useTodayContext must be used within a TodayProvider")
  return ctx
}
