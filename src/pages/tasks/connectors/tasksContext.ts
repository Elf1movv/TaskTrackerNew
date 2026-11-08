import { createContext, useContext } from "react"
import type { Task } from "@/entities/task"

export interface TasksContextValue {
  allTasks: Task[]
  // Active tasks of the chosen category, sorted (see sortActiveTasks).
  activeTasks: Task[]
  // One page of completed tasks, newest first, and how many there are.
  completedPage: Task[]
  completedCount: number
  categoryFilter: string
  setCategoryFilter: (category: string) => void
  page: number
  pageCount: number
  setPage: (page: number) => void
}

export const TasksContext = createContext<TasksContextValue | null>(null)

export function useTasksContext(): TasksContextValue {
  const ctx = useContext(TasksContext)
  if (!ctx) throw new Error("useTasksContext must be used within a TasksProvider")
  return ctx
}
