import { createContext, useContext, useMemo, type ReactNode } from "react"
import { selectTodayTasks, useTasks, type Task } from "@/entities/task"
import { useGoals, type Goal } from "@/entities/goal"
import { useHabits, type Habit } from "@/entities/habit"

interface TodayContextValue {
  todayTasks: Task[]
  goals: Goal[]
  habits: Habit[]
}

const TodayContext = createContext<TodayContextValue | null>(null)

export function TodayProvider({ children }: { children: ReactNode }) {
  const { tasks } = useTasks()
  const { goals } = useGoals()
  const { habits } = useHabits()

  const value = useMemo(
    () => ({ todayTasks: selectTodayTasks(tasks), goals, habits }),
    [tasks, goals, habits],
  )

  return <TodayContext.Provider value={value}>{children}</TodayContext.Provider>
}

export function useTodayContext(): TodayContextValue {
  const ctx = useContext(TodayContext)
  if (!ctx) throw new Error("useTodayContext must be used within a TodayProvider")
  return ctx
}
