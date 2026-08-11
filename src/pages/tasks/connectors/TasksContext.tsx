import { createContext, useContext, useMemo, useState, type ReactNode } from "react"
import { useTasks, type Task } from "@/entities/task"
import type { StatusFilter } from "@/widgets/task-board"
import { filterTasks } from "../utilits/filterTasks"

interface TasksContextValue {
  allTasks: Task[]
  filteredTasks: Task[]
  statusFilter: StatusFilter
  setStatusFilter: (filter: StatusFilter) => void
  categoryFilter: string
  setCategoryFilter: (category: string) => void
}

const TasksContext = createContext<TasksContextValue | null>(null)

export function TasksProvider({ children }: { children: ReactNode }) {
  const { tasks } = useTasks()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [categoryFilter, setCategoryFilter] = useState("all")

  const value = useMemo(
    () => ({
      allTasks: tasks,
      filteredTasks: filterTasks(tasks, statusFilter, categoryFilter),
      statusFilter,
      setStatusFilter,
      categoryFilter,
      setCategoryFilter,
    }),
    [tasks, statusFilter, categoryFilter],
  )

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
}

export function useTasksContext(): TasksContextValue {
  const ctx = useContext(TasksContext)
  if (!ctx) throw new Error("useTasksContext must be used within a TasksProvider")
  return ctx
}
