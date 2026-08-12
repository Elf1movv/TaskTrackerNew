import { useMemo, useState, type ReactNode } from "react"
import { useTasks, type StatusFilter } from "@/entities/task"
import { filterTasks } from "../lib/filterTasks"
import { TasksContext } from "./tasksContext"

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
