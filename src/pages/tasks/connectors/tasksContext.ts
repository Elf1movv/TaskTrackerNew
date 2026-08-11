import { createContext, useContext } from "react"
import type { Task } from "@/entities/task"
import type { StatusFilter } from "@/widgets/task-board"

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
