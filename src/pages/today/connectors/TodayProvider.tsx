import { useMemo, type ReactNode } from "react"
import { selectTodayTasks, useTasks } from "@/entities/task"
import { useGoals } from "@/entities/goal"
import { useHabits } from "@/entities/habit"
import { TodayContext } from "./todayContext"

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
