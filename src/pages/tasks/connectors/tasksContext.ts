import { createContext, useContext } from "react"
import type { StatusFilter, Task } from "@/entities/task"

export interface TasksContextValue {
  allTasks: Task[]
  filteredTasks: Task[]
  statusFilter: StatusFilter
  setStatusFilter: (filter: StatusFilter) => void
  categoryFilter: string
  setCategoryFilter: (category: string) => void
}

export const TasksContext = createContext<TasksContextValue | null>(null)

export function useTasksContext(): TasksContextValue {
  const ctx = useContext(TasksContext)
  if (!ctx) throw new Error("useTasksContext must be used within a TasksProvider")
  return ctx
}
